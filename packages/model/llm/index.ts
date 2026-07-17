import { GoogleGenAI } from '@google/genai';
import { RunWithRetry } from './utils';
import { prisma } from "../db/client";
import * as crypto from 'crypto';
import OpenAI from 'openai';

// ═══════════════════════════════════════════
// MODEL CONFIGURATION
// ═══════════════════════════════════════════

// NVIDIA NIM Provider
const NVIDIA_API_KEY = process.env.NVDIA_KEY ?? "";
const NVIDIA_FALLBACK_MODEL = process.env.NVIDIA_FALLBACK_MODEL ?? "qwen/qwen2.5-coder-32b-instruct";
const NVIDIA_MODELS: Record<string, string> = {
    'CLARIFY': process.env.NVIDIA_CLARIFY_MODEL ?? NVIDIA_FALLBACK_MODEL,
    'PLAN': process.env.NVIDIA_PLAN_MODEL ?? "moonshotai/kimi-k2-thinking",
    'CODE': process.env.NVIDIA_CODE_MODEL ?? NVIDIA_FALLBACK_MODEL,
    'REVIEW': process.env.NVIDIA_REVIEW_MODEL ?? NVIDIA_FALLBACK_MODEL,
};

// Gemini (Google AI Studio) — Pro provider
const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS ?? '').split(',').filter(k => k.trim());

// Dynamic Model Cascade: if the primary model fails (503), it cycles to the next one automatically.
const GEMINI_MODEL_CASCADE = (process.env.GEMINI_MODEL_CASCADE ?? 'gemini-3.1-pro-preview,gemini-2.5-pro,gemini-1.5-pro,gemini-2.5-flash').split(',').map(m => m.trim());
const NVIDIA_MODEL_CASCADE = (process.env.NVIDIA_MODEL_CASCADE ?? 'z-ai/glm-5.2,deepseek-ai/deepseek-v4-flash').split(',').map(m => m.trim());

const GEMINI_MODELS: Record<string, string> = {
    'CLARIFY': process.env.GEMINI_CLARIFY_MODEL ?? "gemini-2.5-pro",
    'PLAN': process.env.GEMINI_PLAN_MODEL ?? "gemini-2.5-pro",
    'CODE': process.env.GEMINI_CODE_MODEL ?? "gemini-3.1-pro-preview",
    'REVIEW': process.env.GEMINI_REVIEW_MODEL ?? "gemini-2.5-pro",
};

interface PrepareParams {
    system: string;
    prompt: string;
    mode: 'CLARIFY' | 'PLAN' | 'CODE' | 'REVIEW';
    json?: boolean;
    sessionId: string;
    stream?: boolean;
    skipCache?: boolean;
}

export enum Tier {
    FREE = 'FREE',
    PRO = 'PRO'
}

export class LLM {
    public onRetry?: (attempt: number, error: any) => void;
    private geminiKeyIndex: number = 0;
    private nvidiaClient: OpenAI;

    constructor(private tier: Tier = Tier.FREE) {
        this.nvidiaClient = new OpenAI({
            baseURL: 'https://integrate.api.nvidia.com/v1',
            apiKey: NVIDIA_API_KEY,
            timeout: 120_000,
        });
    }

    private hash(txt: string): string {
        return String(crypto.createHash('sha256').update(txt).digest('hex'));
    }

    private getNextGeminiKey(): string {
        if (GEMINI_API_KEYS.length === 0) return '';
        const key = GEMINI_API_KEYS[this.geminiKeyIndex];
        this.geminiKeyIndex = (this.geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
        return key.trim();
    }

    private getTokenLimit(mode: 'CLARIFY' | 'PLAN' | 'CODE' | 'REVIEW'): number {
        return mode === 'CODE' ? 100000 : 32000;
    }

    private getTemperature(mode: 'CLARIFY' | 'PLAN' | 'CODE' | 'REVIEW'): number {
        return mode === 'CODE' ? 0.4 : 0.2;
    }

    // ═══════════════════════════════════════════
    // NVIDIA PROVIDER (Free/NIM Tier)
    // ═══════════════════════════════════════════
    private async generateWithNvidia<T>(params: PrepareParams): Promise<T | AsyncGenerator<string, void, unknown>> {
        const primaryModel = NVIDIA_MODELS[params.mode] || NVIDIA_FALLBACK_MODEL;
        // Build the cascade for this request
        const modelsToTry = Array.from(new Set([primaryModel, ...NVIDIA_MODEL_CASCADE]));
        let lastError: any;

        for (const model of modelsToTry) {
            console.log(`[LLM Gateway] Mode: ${params.mode} -> Trying NVIDIA Model: ${model}`);
            
            try {
                // Determine if we should use thinking mode
                const useThinking = model.includes("nemotron-3-ultra") || model.includes("deepseek-v4") || model.includes("glm-5.2") || model.includes("thinking");
                const hashPrompt = this.hash(params.system + params.prompt + model + this.tier);

                // Check cache before running RunWithRetry
                if (!params.skipCache) {
                    const cached = await (prisma.llmCache as any).findFirst({
                        where: {
                            promptHash: hashPrompt,
                            tier: this.tier
                        }
                    });

                    if (cached) {
                        console.log(`[LLM Cache] Hit for NVIDIA model: ${model}`);
                        if (params.stream) {
                            if (params.sessionId && params.mode === 'CODE') {
                                await prisma.session.update({
                                    where: { id: params.sessionId },
                                    data: { status: 'REVIEW', code: { code: cached.response } }
                                }).catch(() => {});
                            }
                            return (async function* () {
                                yield cached.response as string;
                            })() as AsyncGenerator<string, void, unknown>;
                        } else {
                            return (params.json ? JSON.parse(cached.response as string) : cached.response) as T;
                        }
                    }
                }

                return await RunWithRetry(async () => {
                    if (params.stream) {
                        const res = await (this.nvidiaClient.chat.completions.create({
                            model: model,
                            temperature: this.getTemperature(params.mode),
                            max_tokens: this.getTokenLimit(params.mode),
                            messages: [
                                { role: 'system', content: params.system },
                                { role: 'user', content: params.prompt }
                            ],
                            ...(useThinking ? { chat_template_kwargs: { "enable_thinking": true, "clear_thinking": true } } : {}),
                            stream: true,
                        } as any) as any);

                        let fullRes = '';
                        const self = this;
                        return (async function* () {
                            try {
                                for await (const chunk of res) {
                                    const text = chunk.choices[0]?.delta?.content || '';
                                    fullRes += text;
                                    yield text;
                                }

                                if (!params.skipCache && fullRes.trim()) {
                                    await prisma.llmCache.create({
                                        data: {
                                            promptHash: hashPrompt,
                                            response: fullRes,
                                            model: `nvidia:${model}`,
                                            tier: self.tier as any
                                        }
                                    }).catch(() => { });
                                }

                                if (params.sessionId && params.mode === 'CODE') {
                                    await prisma.session.update({
                                        where: { id: params.sessionId },
                                        data: { status: 'REVIEW', code: { code: fullRes } }
                                    });
                                }
                            } catch (streamErr) {
                                console.error("[LLM Gateway] Stream error:", streamErr);
                                if (params.sessionId) {
                                    await prisma.session.update({
                                        where: { id: params.sessionId },
                                        data: { status: 'FAILED', error: "Stream connection lost during generation" }
                                    }).catch(() => {});
                                }
                                throw streamErr;
                            }
                        })();
                    } else {
                        const requestParams: any = {
                            model: model,
                            temperature: this.getTemperature(params.mode),
                            max_tokens: this.getTokenLimit(params.mode),
                            messages: [
                                { role: 'system', content: params.system },
                                { role: 'user', content: params.prompt }
                            ],
                            ...(useThinking ? { chat_template_kwargs: { "enable_thinking": true, "clear_thinking": true } } : {})
                        };
                        
                        if (params.json) {
                            // Fallback if nvext isn't supported by the model
                            requestParams.response_format = { type: 'json_object' };
                        }

                        const res = await this.nvidiaClient.chat.completions.create(requestParams, {
                            timeout: params.mode === 'CODE' ? 90_000 : 20_000
                        });

                        let content = res.choices[0]?.message?.content;
                        if (!content || !content.trim()) throw new Error('No content in NVIDIA response');

                        if (params.json) {
                            try {
                                JSON.parse(content);
                            } catch (e) {
                                // Fallback extraction if model outputs markdown json block
                                const match = content.match(/```(?:json)?([\s\S]*?)```/);
                                if (match && match[1]) {
                                    content = match[1].trim();
                                    JSON.parse(content); // Test if valid now
                                } else {
                                    throw new Error("Invalid JSON output from model");
                                }
                            }
                        }

                        if (!params.skipCache) {
                            await prisma.llmCache.create({
                                data: {
                                    promptHash: hashPrompt,
                                    response: content,
                                    model: `nvidia:${model}`,
                                    tier: this.tier as any
                                }
                            }).catch(() => { });
                        }

                        return (params.json ? JSON.parse(content) : content) as T;
                    }
                }, params.sessionId, 1, 1000, false, this.onRetry); // 1 = immediate fallback to next model in cascade on fail
                
            } catch (err: any) {
                console.error(`[LLM Gateway] Model ${model} failed:`, err.message || err);
                lastError = err;
            }
        }
        
        // If we exhausted all models, fail the session and throw
        if (params.sessionId) {
            await prisma.session.update({
                where: { id: params.sessionId },
                data: { status: 'FAILED', error: `All models in cascade failed. Last error: ${lastError?.message || lastError}` }
            }).catch(() => {});
        }
        throw lastError || new Error("All NVIDIA models in cascade failed");
    }

    // ═══════════════════════════════════════════
    // GEMINI PROVIDER (Pro Tier)
    // ═══════════════════════════════════════════
    private async generateWithGemini<T>(params: PrepareParams, cascadeIndex = 0): Promise<T> {
        const maxKeyAttempts = Math.max(GEMINI_API_KEYS.length, 1);
        
        const primaryModel = GEMINI_MODELS[params.mode] || "gemini-2.5-pro";
        const modelsToTry = Array.from(new Set([primaryModel, ...GEMINI_MODEL_CASCADE]));
        const model = modelsToTry[cascadeIndex % modelsToTry.length];

        console.log(`[LLM Gateway] Mode: ${params.mode} -> Model (Gemini fallback): ${model}`);

        const hashPrompt = this.hash(params.system + params.prompt + model + this.tier);

        // Check cache
        if (!params.skipCache) {
            const cached = await (prisma.llmCache as any).findFirst({
                where: {
                    promptHash: hashPrompt,
                    tier: this.tier
                }
            });
            if (cached) {
                console.log(`[LLM Cache] Hit for Gemini model: ${model}`);
                return (params.json ? JSON.parse(cached.response as string) : cached.response) as T;
            }
        }

        for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
            const apiKey = this.getNextGeminiKey();
            if (!apiKey) break;

            try {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: model,
                    contents: `${params.system}\n\n---\n\n${params.prompt}`,
                    config: {
                        maxOutputTokens: this.getTokenLimit(params.mode),
                        temperature: this.getTemperature(params.mode),
                        responseMimeType: params.json ? 'application/json' : 'text/plain',
                    }
                });

                const content = response.text;

                if (!content || !content.trim()) {
                    console.error('[Gemini] Empty response');
                    throw new Error('No content in Gemini response');
                }

                console.log(`[Gemini] Success — model: ${model}, key #${(this.geminiKeyIndex === 0 ? GEMINI_API_KEYS.length : this.geminiKeyIndex)}, length: ${content.length}`);

                // Cache the response
                if (!params.skipCache) {
                    await prisma.llmCache.create({
                        data: {
                            promptHash: hashPrompt,
                            response: content,
                            model: `gemini:${model}`,
                            tier: this.tier as any
                        }
                    }).catch(() => { });
                }

                return (params.json ? JSON.parse(content) : content) as T;

            } catch (err: any) {
                const status = err?.status || err?.statusCode || 500;
                const message = String(err?.message || '').toLowerCase();

                if (status === 429 || message.includes('resource_exhausted') || message.includes('rate limit')) {
                    console.warn(`[Gemini] Key #${this.geminiKeyIndex} rate limited, rotating...`);
                    continue;
                }

                // Cascade to next model on 503 (busy) or 404 (model not found)
                const isBusy = status === 503 || status === 404 || message.includes('unavailable') || message.includes('overloaded') || message.includes('not found');
                if (isBusy) {
                    const nextIndex = cascadeIndex + 1;
                    if (nextIndex >= modelsToTry.length * 2) {
                        console.error('[Gemini] Exhausted all model cascade loops');
                        throw err;
                    }
                    const nextModel = modelsToTry[nextIndex % modelsToTry.length];
                    console.warn(`[Gemini] ${model} unavailable (503), retrying with fallback: ${nextModel}`);
                    return this.generateWithGemini<T>({ ...params, skipCache: params.skipCache }, nextIndex);
                }

                throw err;
            }
        }

        console.error('[Gemini] All API keys exhausted.');
        throw new Error('All Gemini API keys exhausted. Please add more keys to GEMINI_API_KEYS.');
    }

    private async generateGeminiBuild<T>(params: PrepareParams, cascadeIndex = 0): Promise<T | AsyncGenerator<string, void, unknown>> {
        const apiKey = this.getNextGeminiKey();
        if (!apiKey) throw new Error('No Gemini API keys available');

        const primaryModel = GEMINI_MODELS[params.mode] || "gemini-3.1-pro-preview";
        const modelsToTry = Array.from(new Set([primaryModel, ...GEMINI_MODEL_CASCADE]));
        const model = modelsToTry[cascadeIndex % modelsToTry.length];
        const ai = new GoogleGenAI({ apiKey });

        const hashPrompt = this.hash(params.system + params.prompt + model + this.tier);

        // Check cache before processing stream
        if (!params.skipCache) {
            const cached = await (prisma.llmCache as any).findFirst({
                where: {
                    promptHash: hashPrompt,
                    tier: this.tier
                }
            });
            if (cached) {
                console.log(`[LLM Cache] Hit for Gemini Build model: ${model}`);
                if (params.stream) {
                    if (params.sessionId) {
                        await prisma.session.update({
                            where: { id: params.sessionId },
                            data: { status: 'REVIEW', code: { code: cached.response } }
                        }).catch(() => {});
                    }
                    return (async function* () {
                        yield cached.response as string;
                    })() as AsyncGenerator<string, void, unknown>;
                } else {
                    return (params.json ? JSON.parse(cached.response as string) : cached.response) as T;
                }
            }
        }

        if (params.stream) {
            const self = this;

            return (async function* () {
                let fullRes = '';
                try {
                    console.log(`[Gemini BUILD] Streaming with model: ${model}`);
                    const response = await ai.models.generateContentStream({
                        model,
                        contents: `${params.system}\n\n---\n\n${params.prompt}`,
                        config: {
                            maxOutputTokens: self.getTokenLimit(params.mode),
                            temperature: self.getTemperature(params.mode),
                            tools: [{ codeExecution: {} }],
                        }
                    });

                    for await (const chunk of response) {
                        const text = chunk.text || '';
                        fullRes += text;
                        yield text;
                    }

                    console.log(`[Gemini BUILD] Complete — model: ${model}, length: ${fullRes.length}`);

                    if (!params.skipCache && fullRes.trim()) {
                        await prisma.llmCache.create({
                            data: {
                                promptHash: hashPrompt,
                                response: fullRes,
                                model: `gemini:${model}`,
                                tier: self.tier as any
                            }
                        }).catch(() => { });
                    }

                    if (params.sessionId) {
                        await prisma.session.update({
                            where: { id: params.sessionId },
                            data: { status: 'REVIEW', code: { code: fullRes } }
                        });
                    }
                } catch (err: any) {
                    const status = err?.status || err?.statusCode || 500;
                    const isBusy = status === 503 || status === 404 || String(err?.message || '').toLowerCase().includes('unavailable') || String(err?.message || '').toLowerCase().includes('not found');

                    if (isBusy) {
                        const nextIndex = cascadeIndex + 1;
                        if (nextIndex >= modelsToTry.length * 2) {
                            console.error('[Gemini BUILD] Exhausted all model cascade loops');
                            throw err;
                        }
                        const nextModel = modelsToTry[nextIndex % modelsToTry.length];
                        console.warn(`[Gemini BUILD] ${model} unavailable (503), retrying with fallback: ${nextModel}`);
                        const fallbackGen = await self.generateGeminiBuild<T>({ ...params, skipCache: params.skipCache }, nextIndex) as AsyncGenerator<string, void, unknown>;
                        for await (const chunk of fallbackGen) {
                            yield chunk;
                        }
                        return;
                    }

                    console.error(`[Gemini BUILD] Stream error (model: ${model}):`, err);
                    await prisma.session.update({
                        where: { id: params.sessionId },
                        data: { status: 'FAILED', error: err instanceof Error ? err.message : 'Gemini stream error' }
                    });
                    throw err;
                }
            })();
        } else {
            return this.generateWithGemini<T>(params);
        }
    }

    // ═══════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════
    async generate<T>(params: PrepareParams): Promise<T | AsyncGenerator<string, void, unknown>> {
        try {
            // Route to appropriate provider
            if (this.tier === Tier.PRO) {
                if (params.mode === 'CODE') {
                    return await this.generateGeminiBuild<T>(params);
                }
                return await RunWithRetry(async () => {
                    return this.generateWithGemini<T>(params);
                }, params.sessionId, 3, 1000, true, this.onRetry);
            } else {
                // Free Tier: Use NVIDIA
                return await this.generateWithNvidia<T>(params);
            }

        } catch (err) {
            await prisma.session.update({
                where: { id: params.sessionId },
                data: {
                    status: 'FAILED',
                    error: err instanceof Error ? err.message : 'Unknown error'
                }
            });
            console.error('[LLM] Error in generate:', err);
            throw err;
        }
    }
}

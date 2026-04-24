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
const GEMINI_MODEL_CASCADE = (process.env.GEMINI_MODEL_CASCADE ?? 'gemini-2.5-pro,gemini-1.5-pro,gemini-2.5-flash').split(',').map(m => m.trim());

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
    private geminiKeyIndex: number = 0;
    private nvidiaClient: OpenAI;

    constructor(private tier: Tier = Tier.FREE) {
        this.nvidiaClient = new OpenAI({
            baseURL: 'https://integrate.api.nvidia.com/v1',
            apiKey: NVIDIA_API_KEY
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
        const model = NVIDIA_MODELS[params.mode] || NVIDIA_FALLBACK_MODEL;
        const hashPrompt = this.hash(params.system + params.prompt);

        console.log(`[LLM Gateway] Mode: ${params.mode} -> Model: ${model}`);

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
                    chat_template_kwargs: { "enable_thinking": true, "clear_thinking": true },
                    stream: true,
                } as any) as any);

                let fullRes = '';
                const self = this;
                return (async function* () {
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
                })();
            } else {
                const res = await this.nvidiaClient.chat.completions.create({
                    model: model,
                    temperature: this.getTemperature(params.mode),
                    max_tokens: this.getTokenLimit(params.mode),
                    messages: [
                        { role: 'system', content: params.system },
                        { role: 'user', content: params.prompt }
                    ],
                    response_format: params.json ? { type: 'json_object' } : undefined
                });

                const content = res.choices[0]?.message?.content;
                if (!content || !content.trim()) throw new Error('No content in NVIDIA response');

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
        }, params.sessionId);
    }

    // ═══════════════════════════════════════════
    // GEMINI PROVIDER (Pro Tier)
    // ═══════════════════════════════════════════
    private async generateWithGemini<T>(params: PrepareParams, cascadeIndex = 0): Promise<T> {
        const maxKeyAttempts = Math.max(GEMINI_API_KEYS.length, 1);
        const model = GEMINI_MODEL_CASCADE[cascadeIndex % GEMINI_MODEL_CASCADE.length];

        console.log(`[LLM Gateway] Mode: ${params.mode} -> Model (Gemini fallback): ${model}`);

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
                    const hashPrompt = this.hash(params.system + params.prompt);
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
                    if (nextIndex >= GEMINI_MODEL_CASCADE.length * 2) {
                        console.error('[Gemini] Exhausted all model cascade loops');
                        throw err;
                    }
                    const nextModel = GEMINI_MODEL_CASCADE[nextIndex % GEMINI_MODEL_CASCADE.length];
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

        const model = GEMINI_MODEL_CASCADE[cascadeIndex % GEMINI_MODEL_CASCADE.length];
        const ai = new GoogleGenAI({ apiKey });

        if (params.stream) {
            const self = this;
            const hashPrompt = this.hash(params.system + params.prompt);

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
                        if (nextIndex >= GEMINI_MODEL_CASCADE.length * 2) {
                            console.error('[Gemini BUILD] Exhausted all model cascade loops');
                            throw err;
                        }
                        const nextModel = GEMINI_MODEL_CASCADE[nextIndex % GEMINI_MODEL_CASCADE.length];
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
        const hashPrompt = this.hash(params.system + params.prompt);

        try {
            // Check cache first (segregated by tier)
            if (!params.skipCache) {
                // We use any cast for Tier to avoid potential import mismatches with generated prisma
                const cached = await (prisma.llmCache as any).findFirst({
                    where: {
                        promptHash: hashPrompt,
                        tier: this.tier
                    }
                });

                if (cached) {
                    try {
                        if (params.stream) {
                            return (async function* () {
                                yield cached.response as string;
                            })() as AsyncGenerator<string, void, unknown>;
                        } else {
                            return (params.json
                                ? JSON.parse(cached.response as string)
                                : cached.response
                            ) as T;
                        }
                    } catch (err) {
                        console.error('[Cache] Error returning cached response:', err);
                    }
                }
            }

            // Route to appropriate provider
            if (this.tier === Tier.PRO) {
                if (params.mode === 'CODE') {
                    return await this.generateGeminiBuild<T>(params);
                }
                return await RunWithRetry(async () => {
                    return this.generateWithGemini<T>(params);
                }, params.sessionId);
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

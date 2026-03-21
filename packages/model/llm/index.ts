import OpenAI from 'openai';
import { RunWithRetry } from './utils';
import { prisma } from "../db/client";
import * as crypto from 'crypto';

const MODEL = process.env.OPENROUTER_MODEL ?? ''; //model to  be aded
const CODEMODEL = process.env.OPENROUTER_MODEL_BUILDER ?? '';//model to be added

const LLMKEY = process.env.OPENROUTER_API_KEY ?? "";
interface prepareParams {
    system: string;
    prompt: string;
    mode: 'PLAN' | 'BUILD';
    json?: boolean;
    sessionId: string;
    stream?: boolean;
    skipCache?: boolean;
}
export class LLM {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: LLMKEY
        });

    }

    hash(txt: string) {
        return String(crypto.createHash('sha256').update(txt).digest('hex'));
    }
    async generate<T>(params: prepareParams): Promise<T | AsyncGenerator<string, void, unknown>> {
        const model = params.mode === 'PLAN' ? MODEL : CODEMODEL
        const hashPrompt = this.hash(params.system + params.prompt);
        const tokens = params.mode === 'BUILD' ? 16000 : 8192;
        const temp = params.mode === 'BUILD' ? 0.2 : 0.1;
        const messages = [
            { "role": "system" as const, "content": params.system },
            { "role": "user" as const, "content": params.prompt },
        ];

        try {
            if (params.skipCache) {
                console.log("[LLM] Cache skipped for this request (skipCache=true)");
            } else {
                const cached = await prisma.llmCache.findUnique({
                    where: {
                        promptHash: hashPrompt
                    }
                })

                if (cached) {
                    try {
                        if (params.stream) {
                            return (async function* () {
                                yield cached.response as string;
                            })() as AsyncGenerator<string, void, unknown>
                        }
                        else {
                            return (params.json
                                ? JSON.parse(cached.response as string)
                                : cached.response
                            ) as T;
                        }
                    } catch (err) {
                        console.error("[Stream - error] Error in returning cached response: ", err);
                        await prisma.session.update({
                            where: { id: params.sessionId },
                            data: {
                                status: 'FAILED',
                                error: err instanceof Error ? err.message : "Stream interrupted"
                            }
                        });
                        throw err;
                    }
                }
            }

            return await RunWithRetry(async () => {
                if (params.stream) {
                    const res = await this.client.chat.completions.create({
                        model: model,
                        temperature: temp,
                        max_tokens: tokens,
                        messages: messages,
                        stream: true
                    })
                    let fullRes = "";
                    return (async function* () {
                        try {
                            for await (const chunk of res as any) {
                                const text = chunk.choices[0]?.delta?.content || "";
                                fullRes += text;
                                yield text;
                            }
                            if (!fullRes || !fullRes.trim()) {
                                console.error("[LLM - Stream] Stream ended but produced no text content. The LLM might have output invisible characters or a weird response object.");
                                throw new Error("No content in LLM stream");
                            }

                            await prisma.llmCache.create({
                                data: {
                                    promptHash: hashPrompt,
                                    response: fullRes,
                                    model: model
                                }
                            })

                            if (params.sessionId && params.mode === 'BUILD') {
                                await prisma.session.update({
                                    where: { id: params.sessionId },
                                    data: {
                                        status: 'REVIEW',
                                        code: { code: fullRes }
                                    }
                                })
                            }
                        } catch (err) {
                            console.error("[Stream - error] Error in streaming response: ", err);
                            await prisma.session.update({
                                where: { id: params.sessionId },
                                data: {
                                    status: 'FAILED',
                                    error: err instanceof Error ? err.message : "Stream interrupted"
                                }
                            });
                            throw err;
                        }
                    })();
                }
                else {
                    const res = await this.client.chat.completions.create({
                        model: model,
                        temperature: temp,
                        max_tokens: tokens,
                        messages: messages,
                        response_format: (params.json) ? { type: "json_object" } : undefined,
                        stream: false
                    })
                    const content = res.choices[0]?.message?.content;

                    if (!content || !content.trim()) {
                        console.error("[LLM - Error] Empty content in non-stream response. Full response object:", JSON.stringify(res, null, 2));
                        await prisma.session.update({
                            where: { id: params.sessionId },
                            data: { status: 'FAILED', error: "No content in LLM response" }
                        })
                        throw new Error("No content in LLM response");
                    }
                    console.log("[LLM - Success] Non-streamed content length:", content.length);
                    const parsedResponse = params.json ? JSON.parse(content) : content as T;

                    await prisma.llmCache.create({
                        data: {
                            promptHash: hashPrompt,
                            response: content,
                            model: model
                        }
                    })

                    return parsedResponse as T;

                }
            }, params.sessionId)


        }
        catch (err) {
            await prisma.session.update({
                where: {
                    id: params.sessionId
                },
                data: {
                    status: 'FAILED',
                    error: err instanceof Error ? err.message : "Unknown error"
                }
            })
            console.error("[LLM - error] Error in Prepare: ", err);
            throw err;
        }

    }
}

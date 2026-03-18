import OpenAI from 'openai';
import { RunWithRetry, LLMError } from './utils';
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
}
export class LLM {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: LLMKEY
        });

    }

    async hash(txt: string) {
        return String(crypto.createHash('sha256').update(txt).digest('hex'));
    }
    async generate<T>(params: prepareParams): Promise<T> {
        const model = params.mode === 'PLAN' ? MODEL : CODEMODEL
        const hashPrompt = await this.hash(params.system + params.prompt);

        try {
            const cached = await prisma.llmCache.findUnique({
                where: {
                    promptHash: hashPrompt
                }
            })

            if (cached) {
                return cached.response as T;
            }

            const response = await RunWithRetry(async () => {
                const res = await this.client.chat.completions.create({
                    model: model,
                    temperature: params.mode === 'BUILD' ? 0.2 : 0.1,
                    max_tokens: params.mode === 'BUILD' ? 16000 : 4096,
                    messages: [
                        { "role": "system", "content": params.system },
                        { "role": "user", "content": params.prompt },
                    ],
                    response_format: params.json ? { type: "json_object" } : undefined
                })
                const content = res.choices[0].message.content;
                if (!content) {
                    await prisma.session.update({
                        where: { id: params.sessionId },
                        data: { status: 'FAILED', error: "No content in LLM response" }
                    })
                    throw new Error("No content in LLM response");
                }
                return JSON.parse(content) as T;
            }, params.sessionId)

            if (response) {
                await prisma.llmCache.create({
                    data: {
                        promptHash: hashPrompt,
                        response: response,
                        model: model
                    }
                })
            }
            return response
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

import { prisma } from "../db/client";

export class LLMError extends Error {
    public readonly retryable: boolean;

    constructor(message: string, status?: number) {
        super(message);

        if (status === 500 || status === 503) {

            this.retryable = true;
            this.name = "LlmError - Provider server error";
        }
        else if (status === 429) {
            if (message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota")) {
                this.retryable = false;
                this.name = "LlmError - Rate Limit Exceeded";
            } else {
                this.retryable = true;
                this.name = "LlmError - Too many Requests";
            }
        } else {
            this.retryable = true;
            this.name = "LlmError - Unknown Error";
        }
    }
}

export async function RunWithRetry(
    fn: () => Promise<any>,
    sessionId: string,
    retries: number = 3,
    delay: number = 1000,
): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (err: any) {
            if (err instanceof LLMError && !err.retryable) {
                console.error(`[LLM - error] Non-retryable error: ${err.message}`);

                await prisma.session.update({
                    where: {
                        id: sessionId
                    },
                    data: {
                        status: "FAILED",
                        retries: attempt,
                        error: `[LLM - error] Non-retryable error: ${err.message}`
                    }
                })
                throw err;
            }
            else {
                if (attempt === retries) {
                    console.error(`[LLM - error] Max retries reached: ${err.message}`);
                    await prisma.session.update({
                        where: {
                            id: sessionId
                        },
                        data: {
                            status: "FAILED",
                            retries: attempt,
                            error: `[LLM - error] Max retries reached: ${err.message}`
                        }
                    })
                    throw err;
                }
                console.log(`[LLM - error] Retry attempt ${attempt} failed with error: ${err.message}`);
                await new Promise((resolve) => setTimeout(resolve, delay * attempt));
            }

        }
    }
    throw new Error("Unreachable");

}

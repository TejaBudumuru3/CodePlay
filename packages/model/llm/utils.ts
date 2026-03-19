import { prisma } from "../db/client";

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
            const status = err.status || err.statusCode || 500;
            const rawMessage = err.message || (err.error && err.error.message) || String(err) || "Unknown error";
            const message = String(rawMessage).toLowerCase();
            const isRateLimiter = status === 429
            const isQuotaError = isRateLimiter && (message.includes("rate limit") || message.includes("quota"));
            const isClientError = status >= 400 && status < 500 && !isRateLimiter;

            const isRetryable = !isClientError && !isQuotaError;

            if (!isRetryable) {
                console.error(`[LLM - error] Non-retryable error: ${rawMessage}`);

                await prisma.session.update({
                    where: {
                        id: sessionId
                    },
                    data: {
                        status: "FAILED",
                        retries: attempt,
                        error: `[LLM - error] Non-retryable error: ${rawMessage}`
                    }
                })
                throw err;
            }

            if (attempt === retries) {
                console.error(`[LLM - error] Max retries reached: ${rawMessage}`);
                await prisma.session.update({
                    where: {
                        id: sessionId
                    },
                    data: {
                        status: "FAILED",
                        retries: attempt,
                        error: `[LLM - error] Max retries reached: ${rawMessage}`
                    }
                })
                throw err;
            }
            console.log(`[LLM - error] Retry attempt ${attempt} failed with error: ${rawMessage}`);
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));

        }
    }
    throw new Error("Unreachable");

}

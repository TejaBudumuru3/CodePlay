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
            const isRateLimiter = status === 429;
            const isPermanentQuota = isRateLimiter && message.includes("quota") && !message.includes("rate limit");
            const isClientError = status >= 400 && status < 500 && !isRateLimiter;

            const isRetryable = !isClientError && !isPermanentQuota;

            if (!isRetryable) {
                console.error(`[LLM - error] Non-retryable error (attempt ${attempt}): ${rawMessage}`);

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
                console.error(`[LLM - error] Max retries reached (${retries}): ${rawMessage}`);
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

            const isRateLimit = isRateLimiter || message.includes('rate limit');
            const baseDelay = isRateLimit ? 10000 : delay;
            const backoff = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
            console.log(`[LLM] Retry ${attempt}/${retries} after ${Math.round(backoff)}ms${isRateLimit ? ' (rate limited)' : ''} — ${rawMessage}`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
        }
    }
    throw new Error("Unreachable");
}

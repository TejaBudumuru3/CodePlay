import { z } from "zod"
import { ErrorCode, getUserSafeMessage, USER_SAFE_MESSAGES } from "./errorMessages"

export interface ClassifiedError {
    code: ErrorCode;
    statusCode: number;
    retryable: boolean;
    provider: "nvidia" | "gemini" | "prisma" | "unknown";
    rawMessage: string;    // Technical detail for server-side logging
    userMessage: string;   // Clean generic message for UI/client
    validationErrors?: string[];
}

export type ApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: ClassifiedError };

export function classifyError(
    err: unknown,
    provider: "nvidia" | "gemini" | "prisma" | "unknown" = "unknown"
): ClassifiedError {
    const rawMessage = err instanceof Error ? err.message : String(err);

    // 0. If error is already classified or carries an explicit ErrorCode
    if ((err as any)?.code && typeof (err as any).code === "string") {
        const customCode = (err as any).code as ErrorCode;
        if (customCode in USER_SAFE_MESSAGES) {
            return {
                code: customCode,
                statusCode: (err as any)?.statusCode || 500,
                retryable: (err as any)?.retryable ?? false,
                provider,
                rawMessage,
                userMessage: (err as any)?.userMessage || getUserSafeMessage(customCode),
            };
        }
    }

    // 0b. If the error message is already a known curated user-safe message, preserve it
    const matchingEntry = Object.entries(USER_SAFE_MESSAGES).find(([_, msg]) => msg === rawMessage);
    if (matchingEntry) {
        return {
            code: matchingEntry[0] as ErrorCode,
            statusCode: 500,
            retryable: false,
            provider,
            rawMessage,
            userMessage: rawMessage,
        };
    }

    // 1. Zod schema validation errors
    if (err instanceof z.ZodError || (err as any)?.name === "ZodError") {
        const zodErr = err as z.ZodError;
        const validationErrors = zodErr.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        return {
            code: "MALFORMED_RESPONSE",
            statusCode: 422,
            retryable: true,
            provider,
            rawMessage: `Schema validation failed: ${validationErrors.join("; ")}`,
            userMessage: getUserSafeMessage("MALFORMED_RESPONSE"),
            validationErrors,
        };
    }

    // 2. Extract numeric status code if present
    let statusCode = 0;
    if ((err as any)?.status || (err as any)?.statusCode) {
        statusCode = parseInt((err as any)?.status ?? (err as any)?.statusCode);
    } else {
        const match = rawMessage.match(/\b(4\d\d|5\d\d)\b/);
        if (match) {
            statusCode = parseInt(match[1]);
        }
    }

    // 3. Classify according to failure type and HTTP status
    let code: ErrorCode = "UNKNOWN";
    let retryable = false;

    if (
        statusCode === 429 ||
        rawMessage.includes("RESOURCE_EXHAUSTED") ||
        rawMessage.toLowerCase().includes("rate limit")
    ) {
        code = "RATE_LIMITED";
        retryable = true;
    } else if (
        statusCode === 408 ||
        (err as any)?.name === "AbortError" ||
        (err as any)?.name === "APIUserAbortError" ||
        (err as any)?.code === "ETIMEDOUT" ||
        (err as any)?.code === "ERR_CANCELED" ||
        (err as any)?.code === "ECONNRESET" ||
        rawMessage.toLowerCase().includes("timeout") ||
        rawMessage.toLowerCase().includes("timed out") ||
        rawMessage.toLowerCase().includes("aborted") ||
        rawMessage.toLowerCase().includes("econnreset")
    ) {
        code = "TIMEOUT";
        retryable = false; // Fast cascade: do not repeat on the same hung model; switch immediately to alternative
    } else if (
        statusCode === 529 ||
        (statusCode >= 500 && statusCode < 600) ||
        rawMessage.includes("529") ||
        rawMessage.toLowerCase().includes("overloaded") ||
        rawMessage.toLowerCase().includes("fetch failed") ||
        (err as any)?.code === "ECONNREFUSED" ||
        (err as any)?.code === "ENOTFOUND"
    ) {
        code = "OVERLOADED";
        retryable = true;
    } else if (statusCode === 410 || rawMessage.includes("410")) {
        code = "MODEL_GONE";
        retryable = false; // Cascades to next model in list
    } else if (statusCode === 404) {
        code = "NOT_FOUND";
        retryable = false; // Cascades to next model in list
    } else if (
        statusCode === 401 ||
        statusCode === 403 ||
        rawMessage.toLowerCase().includes("api key")
    ) {
        code = "AUTH_FAILED";
        retryable = false;
    } else if (statusCode >= 400 && statusCode < 500) {
        code = "BAD_REQUEST";
        retryable = false;
    } else if (
        provider === "prisma" ||
        (typeof (err as any)?.code === "string" && (err as any).code.startsWith("P"))
    ) {
        code = "DATABASE_ERROR";
        retryable = false;
    }

    return {
        code,
        statusCode,
        retryable,
        provider,
        rawMessage,
        userMessage: getUserSafeMessage(code),
    };
}

export function extractAndParseJson<T>(rawText: string, schema?: z.ZodType<T>): T {
    let cleaned = rawText.trim();

    // Remove markdown code fences if present (e.g. ```json ... ```)
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    let parsed: any;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        // If direct parse fails, attempt to locate the outermost JSON structure
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");

        let start = -1;
        let end = -1;

        if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            start = firstBrace;
            end = lastBrace + 1;
        } else if (firstBracket !== -1 && lastBracket !== -1) {
            start = firstBracket;
            end = lastBracket + 1;
        }

        if (start !== -1 && end !== -1 && end > start) {
            parsed = JSON.parse(cleaned.slice(start, end));
        } else {
            throw new Error(`Failed to parse JSON response: ${rawText.slice(0, 150)}...`);
        }
    }

    // Unwrap outer wrapper keys sometimes produced by models like Nemotron/Qwen
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (parsed.response && typeof parsed.response === "object") {
            parsed = parsed.response;
        } else if (parsed.data && typeof parsed.data === "object") {
            parsed = parsed.data;
        } else if (parsed.clarification && typeof parsed.clarification === "object") {
            parsed = parsed.clarification;
        } else if (parsed.result && typeof parsed.result === "object") {
            parsed = parsed.result;
        }
    }

    // Runtime schema validation with Zod
    if (schema) {
        const validation = schema.safeParse(parsed);
        if (!validation.success) {
            throw validation.error;
        }
        return validation.data;
    }

    return parsed as T;
}

export interface SafeApiCallOptions<T> {
    provider?: "nvidia" | "gemini" | "prisma" | "unknown";
    schema?: z.ZodType<T>;
    maxRetries?: number;
    timeoutMs?: number;
    baseDelayMs?: number;
}

export async function safeApiCall<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options: SafeApiCallOptions<T> = {}
): Promise<ApiResult<T>> {
    const provider = options.provider ?? "unknown";
    const maxRetries = options.maxRetries ?? 3;
    const timeoutMs = options.timeoutMs ?? 60000;
    const baseDelayMs = options.baseDelayMs ?? 1000;

    let lastError: ClassifiedError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const raw = await operation(controller.signal);
            clearTimeout(timeoutId);

            let data: T;
            if (typeof raw === "string" && options.schema) {
                data = extractAndParseJson<T>(raw, options.schema);
            } else if (options.schema && raw && typeof raw === "object") {
                const validated = options.schema.safeParse(raw);
                if (!validated.success) {
                    throw validated.error;
                }
                data = validated.data;
            } else {
                data = raw;
            }

            return { ok: true, data };
        } catch (err: unknown) {
            clearTimeout(timeoutId);
            const classified = classifyError(err, provider);
            lastError = classified;

            console.warn(
                `[safeApiCall] Attempt ${attempt}/${maxRetries} failed (${provider}): [${classified.code}] ${classified.rawMessage}`
            );

            // Retry on temporary/retryable errors if we haven't reached maxRetries
            if (attempt < maxRetries && classified.retryable) {
                const backoffDelay =
                    classified.code === "RATE_LIMITED"
                        ? 5000 + Math.random() * 1000
                        : baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;

                console.warn(`[safeApiCall] Retrying in ${Math.round(backoffDelay)}ms...`);
                await new Promise((resolve) => setTimeout(resolve, backoffDelay));
                continue;
            }

            break;
        }
    }

    return {
        ok: false,
        error:
            lastError ?? {
                code: "UNKNOWN",
                statusCode: 0,
                retryable: false,
                provider,
                rawMessage: "Unknown failure in safeApiCall",
                userMessage: getUserSafeMessage("UNKNOWN"),
            },
    };
}


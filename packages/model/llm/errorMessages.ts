export type ErrorCode =
    | "RATE_LIMITED"
    | "TIMEOUT"
    | "OVERLOADED"
    | "AUTH_FAILED"
    | "NOT_FOUND"
    | "MODEL_GONE"
    | "BAD_REQUEST"
    | "MALFORMED_RESPONSE"
    | "ALL_EXHAUSTED"
    | "DATABASE_ERROR"
    | "GENERATION_FAILED"
    | "UNKNOWN";

export const USER_SAFE_MESSAGES: Record<ErrorCode, string> = {
    RATE_LIMITED: "Our AI servers are experiencing high demand. Please try again shortly.",
    TIMEOUT: "The AI request took too long to complete. Retrying...",
    OVERLOADED: "AI services are currently under heavy load. Please try again in a moment.",
    AUTH_FAILED: "Authentication failed. Please sign in again.",
    NOT_FOUND: "The requested AI model is unavailable. Trying an alternative...",
    MODEL_GONE: "The requested AI model has been no longer avaliable. Switching to an alternative...",
    BAD_REQUEST: "The request could not be processed. Please check your prompt and try again.",
    MALFORMED_RESPONSE: "The AI produced an unexpected response format. Retrying with an alternative model...",
    ALL_EXHAUSTED: "All AI services are currently unavailable. Please try again in a few minutes.",
    DATABASE_ERROR: "Unable to save your progress due to a database issue. Please try again.",
    GENERATION_FAILED: "Game generation failed. Your credit has been refunded.",
    UNKNOWN: "An unexpected error occurred. Please try again."
};

export function getUserSafeMessage(code?: string | null): string {
    if (code && code in USER_SAFE_MESSAGES) {
        return USER_SAFE_MESSAGES[code as ErrorCode];
    }
    return USER_SAFE_MESSAGES.UNKNOWN;
}


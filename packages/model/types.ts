import { z } from "zod"
export const MCQOptionSchema = z.object({
    key: z.enum(['A', 'B', 'C', 'D']),
    text: z.string()
})
export type MCQOption = z.infer<typeof MCQOptionSchema>

export const MCQQuestionSchema = z.object({
    id: z.number().int(),
    question: z.string(),
    options: z.array(MCQOptionSchema).default([])
})

export type MCQQuestion = z.infer<typeof MCQQuestionSchema>



export const ClarificationResponseSchema = z.object({
    questions: z.array(MCQQuestionSchema).default([]),
    isSufficient: z.boolean().default(false),
    summary: z.string().default(''),
    confidence: z.number().min(0).max(1).default(0),
    complexityTier: z.enum(["tier1", "tier2", "tier3"]).optional(),
    capabilityHints: z.array(z.string()).default([])
})

export type ClarificationResponse = z.infer<typeof ClarificationResponseSchema>


export const clarificationAnswerSchema = z.object({
    questionId: z.number().int(),
    selectedKey: z.enum(['A', 'B', 'C', 'D']),
    customText: z.string().optional()
})

export type clarificationAnswer = z.infer<typeof clarificationAnswerSchema>


export const PlanResponseSchema = z.object({
    title: z.string(),
    description: z.string(),
    framework: z.enum(["vanilla", "phaser", "custom"]),
    platform: z.enum(["desktop", "mobile"]),
    complexity: z.enum(["tier1", "tier2", "tier3"]),
    mechanics: z.array(z.object({
        name: z.string(),
        description: z.string()
    })).default([]),
    controls: z.array(z.object({
        input: z.string(),
        action: z.string()
    })).default([]),

    systems: z.array(z.string()).default([]),
    assetDescriptions: z.array(z.string()).default([]),
    gameLoopDescription: z.string(),
    physics: z.object({
        type: z.enum(["custom", "arcade"]),
        gravity: z.number().optional(),
        friction: z.number().optional(),
        restitution: z.number().optional(),
        damping: z.number().optional(),
        customNotes: z.string().optional()
    }).optional(),
    stateManagement: z.object({
        states: z.array(z.string()).default([]),
        transitions: z.array(z.object({
            from: z.string(),
            to: z.string(),
            trigger: z.string()
        })).default([])
    }).default({
        states: [],
        transitions: []
    }),
    uiElements: z.array(z.string()).default([]),
    capabilities: z.array(z.string()).default([]),
})

export type PlanResponse = z.infer<typeof PlanResponseSchema>


export const BuildResponseSchema = z.object({
    files: z.array(z.object({
        filename: z.string(),
        content: z.string(),
        type: z.string()
    })).optional(),
    entryPoint: z.string().optional(),
    code: z.string().optional(),
    model: z.string().optional()
})

export type BuildResponse = z.infer<typeof BuildResponseSchema>

export const ReviewerResponseSchema = z.object({
    passed: z.boolean().default(false),
    remarks: z.string().nullish().default(null),
    issues: z.array(z.object({
        severity: z.string(),
        code: z.string(),
        description: z.string(),
        brokenCode: z.string(),
        fix: z.string()
    })).default([])
})

export type ReviewerResponse = z.infer<typeof ReviewerResponseSchema>

export const SessionStatusSchema = z.enum([
    "IDLE",
    "INIT",
    "CLARIFYING",
    "PLANNING",
    "BUILDING",
    "REVIEW",
    "REBUILD",
    "COMPLETED",
    "FAILED",
    "AWAITING_UPGRADE_DECISION"
])

export type SessionStatus = z.infer<typeof SessionStatusSchema>

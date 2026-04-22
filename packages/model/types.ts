
export interface MCQOption {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
}

export interface MCQQuestion {
    id: number;
    question: string;
    options: MCQOption[];
}

export interface ClarificationResponse {
    questions: MCQQuestion[];
    isSufficient: boolean;
    summary: string;
    confidence: number;
    complexityTier?: "tier1" | "tier2" | "tier3";
    capabilityHints?: string[];
}

export interface clarificationAnswer {
    questionId: number;
    selectedKey: 'A' | 'B' | 'C' | 'D';
    customText?: string;
}

export interface PlanResponse {
    title: string;
    description: string;
    framework: "vanilla" | "phaser";
    platform: "desktop" | "mobile";
    complexity: "tier1" | "tier2" | "tier3";
    mechanics: { name: string; description: string }[];
    controls: { input: string; action: string }[];
    systems: string[];
    assetDescriptions: string[];
    gameLoopDescription: string;
    physics?: {
        type: "custom" | "arcade";
        gravity?: number;
        friction?: number;
        restitution?: number;
        damping?: number;
        customNotes?: string;
    };
    stateManagement: {
        states: string[];
        transitions: { from: string; to: string; trigger: string }[];
    };
    uiElements: string[];
    capabilities?: string[];
}

export interface BuildResponse {
    files?: { filename: string; content: string; type: string }[];
    entryPoint?: string;
    code?: string;
}

export interface ReviewerResponse {
    passed: boolean;
    remarks: string | null;
    issues: { severity: string; code: string; description: string; brokenCode: string; fix: string }[];
}

export type SessionStatus =
    | "IDLE"
    | "INIT"
    | "CLARIFYING"
    | "PLANNING"
    | "BUILDING"
    | "REVIEW"
    | "REBUILD"
    | "COMPLETED"
    | "FAILED";
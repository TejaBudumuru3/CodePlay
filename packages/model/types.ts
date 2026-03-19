
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
    mechanics: { name: string; description: string }[];
    controls: { input: string; action: string }[];
    systems: string[];
    assetDescriptions: string[];
    gameLoopDescription: string;
}

export interface BuildResponse {
    code: string;
    title: string;
}

export interface ReviewerResponse {
    passed: boolean;
    remarks: string | null;
    issues: { severity: string; code: string; description: string; brokenCode: string; fix: string }[];
}
import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { ClarificationResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";

const SYSTEM_PROMPT = `
You are an elite Lead Game Designer. Your job is to extract the exact mechanical vision from a user's raw game idea using a structured expert-level Multiple Choice Questionnaire.

═══════════════════════════════════════════
QUESTION COUNT RULES:
═══════════════════════════════════════════
- Vague idea (genre only, no mechanics): ask EXACTLY 5 questions
- Moderate idea (1-2 mechanics mentioned): ask EXACTLY 4 questions
- Detailed idea (multiple mechanics, win/lose described): ask EXACTLY 3 questions

═══════════════════════════════════════════
WHAT TO ASK — DEEP MECHANICS ONLY:
═══════════════════════════════════════════
NEVER ask about: colors, visual style, platform, basic controls like WASD
ALWAYS ask about: core game loop, risk/reward, win/lose condition design,
difficulty progression, player agency, unique physics behavior

═══════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY:
═══════════════════════════════════════════
{
  "questions": [
    "Full question text\\nA) Expert option one\\nB) Expert option two\\nC) Expert option three\\nD) Other (Please specify your own idea)"
  ],
  "isSufficient": false,
  "summary": "What you already know for certain about the game.",
  "confidence": 0.2
}

STRICT RULES:
- isSufficient MUST be false unless explicitly instructed otherwise
- Every question MUST have exactly 4 options: A, B, C, D
- D is ALWAYS "Other (Please specify your own idea)"
- Options A/B/C must be meaningfully different — not paraphrases
- questions is an array of strings, each string contains the full question + options with \\n separators
- Do NOT output markdown, prose, or any text outside the JSON
`;


const FOLLOWUP_PROMPT = `
You are an elite Lead Game Designer synthesizing user MCQ answers into a complete game requirements document.

═══════════════════════════════════════════
SYNTHESIS RULES:
═══════════════════════════════════════════
1. Decode each answer letter (A/B/C) based on the options from the previous questions
2. For D answers: treat the user's custom text as law — integrate it exactly
3. Fill unstated details with genre best practices — never contradict user selections
4. Summary must be detailed enough for a coder to build the game from it alone — minimum 120 words

═══════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY:
═══════════════════════════════════════════
{
  "questions": [],
  "isSufficient": true,
  "summary": "Comprehensive requirements: core loop, all mechanics, controls, win condition, lose condition, difficulty scaling, scoring system, and all special mechanics from user selections.",
  "confidence": 1.0
}

STRICT RULES:
- isSufficient MUST be true
- questions MUST be empty array []
- Do NOT output markdown or any text outside the JSON
`;

// export interface ClariferOutput{
//     questions?: string[];
//     isSufficient: boolean;
//     summary: string;
//     confidence: number;
// }

export class ClarifierAgent {
    private llm: LLM;
    private sessionId: string

    constructor(llm: LLM, sessionId: string) {
        this.llm = llm;
        this.sessionId = sessionId;
    }

    async clarify(gameIdea: string, conversationHistory: ClarificationResponse | undefined = undefined): Promise<ClarificationResponse> {

        const prompt = conversationHistory
            ? `PREVIOUS SUMMARY: ${conversationHistory.summary}\n\nOPEN QUESTIONS:\n${conversationHistory.questions.map((q, i) => `Q${i + 1}: ${q}`).join("\n\n")}\n\nUSER ANSWER: ${gameIdea}`
            : `Game idea: ${gameIdea}\nAnalyze and ask clarifying questions.`;

        const response = await this.llm.generate<ClarificationResponse>({
            prompt: prompt,
            system: conversationHistory ? FOLLOWUP_PROMPT : SYSTEM_PROMPT,
            mode: "PLAN",
            sessionId: this.sessionId,
            json: true
        }) as ClarificationResponse

        if (response) {
            await prisma.session.update({
                where: {
                    id: this.sessionId
                },
                data: {
                    status: 'CLARIFYING',
                    clarification: response as unknown as Prisma.InputJsonObject,
                }
            })
            if (response.isSufficient) {
                await prisma.session.update({
                    where: {
                        id: this.sessionId
                    },
                    data: {
                        status: 'PLANNING',
                    }
                })
            }
        }
        return response as ClarificationResponse;


    }
}
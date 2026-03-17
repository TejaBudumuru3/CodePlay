import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { ClarificationResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";

const SYSTEM_PROMPT = `You are an elite Lead Game Designer. Your job is to extract the exact mechanical vision from the user using a highly structured, expert-level Multiple Choice Questionnaire.

RULES FOR QUESTIONING:
1. DYNAMIC COUNT: If the user's initial prompt is highly detailed, ask EXACTLY 3 questions. If the prompt is vague or only a single sentence, ask EXACTLY 5 questions.
2. SUPERIOR KNOWLEDGE: NEVER ask basic or cosmetic questions (e.g., colors, basic controls). You must ask deep, structural questions about game loops, risk/reward mechanics, scaling difficulty, meta-progression, or unique physics. 
3. FORMAT: Every question MUST be an MCQ formatted directly in the string. You must provide 3 expert-level options (A, B, C) and a 4th option (D) that is ALWAYS "Other (Please specify)".

FORMATTING EXACT EXAMPLE FOR A QUESTION STRING:
"How should the core difficulty scale over time?\\nA) Linear speed increase of all hazards.\\nB) Procedural generation of tighter traversal gaps.\\nC) Introduction of new enemy archetypes with homing attacks.\\nD) Other (Please specify your thoughts)."

JSON OUTPUT FORMAT:
You MUST respond with valid JSON matching this exact structure:
{
  "questions": [
    "Question 1 string with \n formatting for options",
    "Question 2 string with \n formatting for options"
  ],
  "isSufficient": false,
  "summary": "A brief summary of what you already know for certain.",
  "confidence": 0.0 to 1.0
}

On this first turn, isSufficient MUST be false.`;

const FOLLOWUP_PROMPT = `The user has answered your Multiple Choice Questions. Analyze their answers (which may just be letters like A, B, C, or custom text for D).

CRITICAL INSTRUCTIONS:
1. Decode their answers based on the options you provided in the previous turn.
2. If they chose "D" or provided custom text, integrate their exact thoughts.
3. Combine their answers with standard industry best practices for the genre.
4. Set isSufficient to true. Do NOT ask any more questions.

Respond with valid JSON:
{
  "questions": [],
  "isSufficient": true,
  "summary": "A massive, comprehensive requirements document. Include the core loop, mechanics, control schemes, and difficulty scaling based entirely on the user's MCQ selections.",
  "confidence": 1.0
}`;

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
        let historyPrompt = "";
        if (conversationHistory) {
            historyPrompt = `
            PREVIOUS SUMMARY: ${conversationHistory.summary}
            OPEN QUESTIONS: ${conversationHistory.questions.join(", ")}
            USER ANSWER: ${gameIdea}
            `;
        }
        const prompt = historyPrompt ? historyPrompt + FOLLOWUP_PROMPT :
            `Game idea: ${gameIdea}\n Analyze the game idea and ask questions to clarify the requirements.\n`

        const response = await this.llm.generate<ClarificationResponse>({
            prompt: prompt,
            system: SYSTEM_PROMPT,
            mode: "PLAN",
            sessionId: this.sessionId,
            json: true
        })

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
import { prisma } from "../model/db/client";
import { LLM } from "../model/llm";
import { ClarifierAgent } from "../agents/clarifer";
import { PlannerAgent } from "../agents/planner";
import { CoderAgent } from "../agents/coder";
import { ClarificationResponse, BuildResponse, PlanResponse } from "../model/types";

interface ControllerOutput {
    type: 'CLARIFYING' | 'PLANNING' | 'CODING' | 'COMPLETED' | 'ERROR' | 'INIT' | 'STREAM_REQUIRED';
    data: ClarificationResponse | PlanResponse | BuildResponse | string;
}

export class Controller {
    private llm: LLM;
    private sessionId: string;



    constructor(sessionId: string) {
        this.llm = new LLM();
        this.sessionId = sessionId;
    }

    async start(userMessage?: string): Promise<ControllerOutput> {
        try {
            const session = await prisma.session.findUnique({
                where: {
                    id: this.sessionId
                }
            });

            if (!session) throw new Error("Session not found");

            const clarifierAgent = new ClarifierAgent(this.llm, session.id);
            const plannerAgent = new PlannerAgent(this.llm, session.id);
            const builderAgent = new CoderAgent(this.llm, session.id);

            switch (session.status) {
                case 'INIT':
                    const questions = await clarifierAgent.clarify(session.prompt);
                    return {
                        type: 'INIT',
                        data: questions
                    }
                case 'CLARIFYING':
                    const prompt = userMessage ? userMessage : session.prompt;
                    const clarification = await clarifierAgent.clarify(prompt, session.clarification as unknown as ClarificationResponse)

                    return {
                        type: 'CLARIFYING',
                        data: clarification as unknown as ClarificationResponse
                    }
                case 'PLANNING':
                    const planReq = session.clarification as unknown as ClarificationResponse
                    const plan = await plannerAgent.plan(planReq.summary, session.prompt)

                    return {
                        type: 'PLANNING',
                        data: plan as unknown as PlanResponse
                    }

                case 'BUILDING':
                case 'REBUILD':
                case 'REVIEW':
                    return {
                        type: 'STREAM_REQUIRED',
                        data: "Session requires Streaming - connecting to /api/stream"
                    }

                case 'COMPLETED':
                    return {
                        type: 'COMPLETED',
                        data: session.code as unknown as BuildResponse
                    }
                case 'FAILED': {
                    let fallbackStatus = 'INIT';
                    if (session.clarification) {
                        const clar = session.clarification as unknown as ClarificationResponse;
                        fallbackStatus = clar.isSufficient ? 'PLANNING' : 'CLARIFYING';
                    } else if (session.prompt) {
                        fallbackStatus = 'INIT';
                    }

                    await prisma.session.update({
                        where: { id: this.sessionId },
                        data: { status: fallbackStatus as any, error: null }
                    });
                    
                    return this.start(userMessage);
                }

                default:
                    return {
                        type: 'ERROR',
                        data: "Unknown session status"
                    }

            }
        }
        catch (error) {

            console.error(error);
            await prisma.session.update({
                where: {
                    id: this.sessionId
                },
                data: {
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : "Unknown error"
                }
            })
            return {
                type: 'ERROR',
                data: error instanceof Error ? error.message : "Unknown error"
            }
        }
    }




}
import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { PlanResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";

const SYSTEM_PROMPT = `You are an expert game architect and ruthless Project Manager. Given a set of clarified game requirements, produce a structured game plan for a SINGLE-FILE browser prototype.

CRITICAL SCOPE CONSTRAINTS:
1. NO META-SYSTEMS: Strip out all requests for "Tech Trees", "Inventories", "Reputation", or "Save Data". You are building an arcade prototype, not an RPG.
2. LIMIT MECHANICS: Pick a MAXIMUM of 4 core mechanics. Discard the rest. 
3. SIMPLE PHYSICS ONLY: Avoid complex math like gravity wells or procedural joints unless it is the single core hook.

You must decide:
1. Framework: "vanilla" (vanilla JavaScript) or "phaser" (Phaser 3).
   - Use "vanilla" for simple games (snake, pong, tic-tac-toe, simple shooters, clickers).
   - Use "phaser" for games needing physics, complex collisions, sprite management, or tilemap support.
2. Game mechanics: every distinct mechanic the game needs.
3. Controls: every input and what it does.
4. Systems: core technical systems (e.g., "collision", "scoring", "state_management", "spawning").
5. Assets: text descriptions of visual elements (shapes, colors — no external files).
6. Game loop: step-by-step description of what happens each frame.

Respond with valid JSON matching this structure:
{
  "title": "Game Title",
  "description": "1-2 sentence game description",
  "framework": "vanilla" or "phaser",
  "mechanics": [
    { "name": "mechanic name", "description": "what it does" }
  ],
  "controls": [
    { "input": "Arrow Keys", "action": "Move player" }
  ],
  "systems": ["collision", "scoring", ...],
  "assetDescriptions": ["Blue rectangle as player", "Red circles as enemies", ...],
  "gameLoopDescription": "Step by step: 1) Read input 2) Update positions 3) Check collisions..."
}`;

export class PlannerAgent {
    private llm: LLM;
    private sessionId: string;

    constructor(llm: LLM, sessionId: string) {
        this.llm = llm;
        this.sessionId = sessionId;
    }

    async plan(clarifiedRequirements: string, gameIdea: string): Promise<PlanResponse> {
        const prompt = `
        Game Idea: ${gameIdea}
        Clarified Requirements: ${clarifiedRequirements}\n
        Create a detailed game plan based on these requirements.
        `

        const response = await this.llm.generate<PlanResponse>({
            prompt: prompt,
            system: SYSTEM_PROMPT,
            mode: 'PLAN',
            json: true,
            sessionId: this.sessionId
        }) as PlanResponse;

        if (response) {
            await prisma.session.update({
                where: {
                    id: this.sessionId,
                },
                data: {
                    plan: response as unknown as Prisma.InputJsonObject,
                    status: 'BUILDING'
                }
            })
        }

        return response;


    }
}
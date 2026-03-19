import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { PlanResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";

const SYSTEM_PROMPT = `
You are a ruthless Senior Game Architect. Given clarified game requirements, produce a precise technical blueprint for a single-file browser game prototype.

Your output is the ONLY document the coder will use. Be explicit, leave nothing to interpretation.

═══════════════════════════════════════════
FRAMEWORK DECISION:
═══════════════════════════════════════════
Use "vanilla" for:
- Simple games: snake, pong, breakout, flappy bird, tic-tac-toe, clickers
- No physics engine needed, fewer than 5 entity types, no complex collisions

Use "phaser" for:
- Needs real gravity, bounce, velocity-based physics
- Platformers with terrain collision
- More than 5 simultaneous entity types
- Group-based collision management

═══════════════════════════════════════════
SCOPE RULES — ABSOLUTE:
═══════════════════════════════════════════
1. MAXIMUM 4 core mechanics — strip everything else
2. NO meta-systems: no save data, inventory, tech trees, reputation
3. SINGLE SCREEN: no scrolling maps unless scrolling IS the core mechanic
4. assetDescriptions must describe EXACT shapes, sizes and hex colors — no "sprites"
   BAD: "player sprite"
   GOOD: "Player: 40x40 filled rectangle, color #4488FF"
   GOOD: "Enemy: 30px radius circle, color #FF4444"

═══════════════════════════════════════════
GAME LOOP — BE EXPLICIT:
═══════════════════════════════════════════
gameLoopDescription must list numbered steps minimum 8 steps:
1) Read buffered player input
2) Update player position
3) Update enemy positions
4) Check player-enemy collisions
5) Check player-collectible collisions
6) Update score/lives
7) Check win/lose condition
8) Clear canvas
9) Draw all entities in z-order

═══════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON MATCHING THIS EXACT STRUCTURE:
═══════════════════════════════════════════
{
  "title": "Game Title",
  "description": "1-2 sentence description of the core experience",
  "framework": "vanilla" or "phaser",
  "mechanics": [
    { "name": "mechanic name", "description": "exact behavior — no ambiguity" }
  ],
  "controls": [
    { "input": "ArrowLeft / ArrowRight", "action": "Move player horizontally at 200px/s" }
  ],
  "systems": ["collision_detection", "score_tracking", "enemy_spawning", "state_management"],
  "assetDescriptions": [
    "Player: 40x40px filled rectangle, color #4488FF",
    "Enemy: 30px radius filled circle, color #FF4444",
    "Projectile: 8x8px filled square, color #FFFF00",
    "Background: solid fill, color #1a1a2e"
  ],
  "gameLoopDescription": "1) Read input buffer 2) Update player velocity 3) ..."
}

Do NOT include markdown, prose, or any text outside the JSON.
Do NOT add extra fields not listed above.
`;



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
import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { BuildResponse, PlanResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";


const SYSTEM_PROMPT_VANILLA = `You are an expert JavaScript game developer. Generate a complete, playable browser game using ONLY vanilla HTML, CSS, and JavaScript. No external libraries.

You MUST generate EXACTLY 3 files:
1. index.html — Main HTML with canvas or DOM elements. Must include <script src="game.js" defer></script> and <link rel="stylesheet" href="style.css">.
2. style.css — Styling (can be minimal but must exist). Center the game, dark background, clean look.
3. game.js — Complete game logic with game loop (requestAnimationFrame), input handling, rendering, and state management.

CRITICAL RULES:
- The game MUST be fully playable — not a stub or demo.
- All drawing must use Canvas 2D API or DOM manipulation.
- Use geometric shapes for visuals (no image files).
- Include a start screen, gameplay, and game over screen.
- Include scoring if applicable.
- Handle keyboard/mouse input properly.
- The game must run by simply opening index.html in a browser — no build tools.
- Write clean, well-structured code with comments.
- **IMPORTANT**: In game.js, ensure all code runs after the DOM is loaded (use window.addEventListener('DOMContentLoaded', ...)).
- Ensure the canvas is correctly selected and sized.
- NEVER leave placeholder comments like "// add game logic here" — write the full working code.
- Every mechanic listed must be fully implemented.

OUTPUT FORMAT — PURE JSON ONLY. No markdown, no code fences, no \`\`\`json wrapper. Start your response with { and end with }:
{
  "files": [
    { "filename": "index.html", "content": "<!DOCTYPE html>...", "fileType": "html" },
    { "filename": "style.css", "content": "body { ... }", "fileType": "css" },
    { "filename": "game.js", "content": "// game code...", "fileType": "js" }
  ],
  "entryPoint": "index.html"
}`;

const SYSTEM_PROMPT_PHASER = `You are an expert Phaser 3 game developer. Generate a complete, playable browser game using Phaser 3.

You MUST generate EXACTLY 3 files.

CRITICAL PHASER 3 ARCHITECTURE RULES:
1. You MUST use this exact boilerplate structure for game.js to prevent crashes:
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    preload() { 
        // Generate graphics textures here using this.add.graphics(). NO external images. 
    }
    create() {
        // 1. Initialize Physics Groups
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        // 2. Setup Colliders
        this.physics.add.collider(this.projectiles, this.enemies, this.handleHit, null, this);
        // 3. Setup Timers and State variables
        this.lastFired = 0;
    }
    update(time, delta) {
        // 1. Handle input with strict time-based cooldowns!
        // 2. Safely iterate groups:
        this.enemies.getChildren().forEach(enemy => {
            if (enemy && enemy.active) { /* logic */ }
        });
    }
}
window.onload = () => {
    new Phaser.Game({
        type: Phaser.AUTO, width: 800, height: 600,
        physics: { default: 'arcade', arcade: { debug: false } },
        scene: GameScene
    });
};

2. NEVER destroy an object while iterating over its group. Mark it inactive or handle destruction safely.
3. ALWAYS check 'if (object && object.active)' before applying physics or calculating gravity.
4. Rate Limit inputs! If the player shoots, use time-based cooldowns.

OUTPUT FORMAT — PURE JSON ONLY. Start your response with { and end with }:
{
  "files": [
    { "filename": "index.html", "content": "<!DOCTYPE html>...", "fileType": "html" },
    { "filename": "style.css", "content": "body { ... }", "fileType": "css" },
    { "filename": "game.js", "content": "// Phaser game code...", "fileType": "js" }
  ],
  "entryPoint": "index.html"
}`;

export class CoderAgent {

    private llm: LLM;
    private sessionId: string;

    constructor(llm: LLM, sessionId: string) {
        this.llm = llm;
        this.sessionId = sessionId;
    }

    async build(plan: PlanResponse): Promise<BuildResponse> {

        const systemPromt = plan.framework === 'vanilla' ? SYSTEM_PROMPT_VANILLA : SYSTEM_PROMPT_PHASER;

        const prompt = `
        Build the following game:

            Title: ${plan.title}
            Description: ${plan.description}
            Framework: ${plan.framework}

            Mechanics:
            ${plan.mechanics.map((m) => `- ${m.name}: ${m.description}`).join("\n")}

            Controls:
            ${plan.controls.map((c) => `- ${c.input} → ${c.action}`).join("\n")}

            Systems: ${plan.systems.join(", ")}

            Assets (use shapes/colors, no external files):
            ${plan.assetDescriptions.map((a) => `- ${a}`).join("\n")}

            Game Loop:
            ${plan.gameLoopDescription}

            Generate the complete game code now.
        `

        const response = await this.llm.generate<BuildResponse>({
            prompt: prompt,
            system: systemPromt,
            json: true,
            mode: 'BUILD',
            sessionId: this.sessionId
        });

        if (response) {
            await prisma.session.update({
                where: {
                    id: this.sessionId
                },
                data: {
                    status: 'COMPLETED',
                    code: response as unknown as Prisma.InputJsonObject,
                }
            })
        }

        return response
    }
}
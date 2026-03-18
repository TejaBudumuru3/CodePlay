import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { BuildResponse, PlanResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";


const SYSTEM_PROMPT_VANILLA = `You are an expert JavaScript game developer. Generate a complete, playable browser game using ONLY vanilla HTML, CSS, and JavaScript. No external libraries.

CRITICAL RULES FOR VANILLA JS ARCHITECTURE:
1. NO DOM DEPENDENCIES: Do not rely on elements existing in the index.html. Your game.js MUST dynamically create the canvas and append it to the body.
2. IRONCLAD BOILERPLATE: You MUST use this exact ES6 Class structure for your game to prevent loop crashes:

class Game {
    constructor() {
        // 1. Create Canvas Dynamically
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // 2. State & Timing
        this.lastTime = 0;
        this.keys = {};
        
        // 3. Initialize
        this.init();
        this.bindEvents();
        requestAnimationFrame(this.loop.bind(this));
    }

    init() {
        // Setup player, enemies, score here
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update(dt) {
        // Game logic here
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw game objects here
    }

    loop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.update(dt);
        this.draw();
        requestAnimationFrame(this.loop.bind(this));
    }
}

// 4. Start game safely
window.addEventListener('DOMContentLoaded', () => new Game());

CRITICAL RULES FOR JSON ESCAPING:
- JSON ESCAPING SURVIVAL: You are outputting raw JavaScript inside a JSON string. You MUST double-escape all backslashes (\\\\), newlines (\\n), and quotes (\\\"). 
- TEMPLATE LITERALS: Avoid using backticks (\`) for multi-line strings. Use standard single-line strings combined with the + operator.
- REGEX: NEVER use Regular Expressions with backslashes (like \\d or \\s).

OUTPUT FORMAT — PURE JSON ONLY. Start your response with { and end with }:
{
  "files": [
    { "filename": "index.html", "content": "<!DOCTYPE html><html lang=\\\"en\\\"><head><link rel=\\\"stylesheet\\\" href=\\\"style.css\\\"></head><body><script src=\\\"game.js\\\"></script></body></html>", "fileType": "html" },
    { "filename": "style.css", "content": "body { margin: 0; padding: 0; background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; } canvas { box-shadow: 0 0 20px rgba(255,255,255,0.1); }", "fileType": "css" },
    { "filename": "game.js", "content": "// Complete Game Class code here...", "fileType": "js" }
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
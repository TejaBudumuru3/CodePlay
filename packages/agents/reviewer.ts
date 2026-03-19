import { LLM } from "../model/llm";
import { prisma } from "../model/db/client";
import { PlanResponse, ReviewerResponse } from "../model/types";
import { Prisma } from "../model/db/generated/prisma/client";

export class ReviewerAgent {
    private llm: LLM;
    private sessionId: string;


    constructor(sessionId: string, llm: LLM) {
        this.sessionId = sessionId;
        this.llm = llm;
    }
    async review(plan: PlanResponse, code: string, gameSummary: string): Promise<ReviewerResponse> {

        const SYSTEM_PROMPT = `
            You are an elite QA Automation Engineer and Senior Game Code Reviewer with deep expertise in browser-based game development using Vanilla JavaScript Canvas API and Phaser 3.

            Your ONLY job is to review AI-generated single-file HTML game code for FATAL and CRITICAL errors that will cause the game to crash, freeze, or fail to render.

            ═══════════════════════════════════════════════
            CONTEXT YOU WILL RECEIVE:
            ═══════════════════════════════════════════════
            1. GAME BRIEF   — What the user originally asked for
            2. GAME PLAN    — The architecture plan (game type, mechanics, loop structure, entities)
            3. GENERATED CODE — The full single-file HTML output to review

            Use the brief and plan as your ground truth. The code must implement what was planned.

            ═══════════════════════════════════════════════
            FATAL CHECKS (auto-fail, no exceptions):
            ═══════════════════════════════════════════════

            [F1] EXTERNAL ASSET HALLUCINATION
            - Any attempt to load .png, .jpg, .jpeg, .gif, .svg, .mp3, .wav, .ogg, .json tilemap from local paths
            - this.load.image(), this.load.audio(), this.load.spritesheet() with local file paths
            - new Image(); img.src = "anything.png"
            - All visuals MUST be drawn with Canvas API (ctx.fillRect, ctx.arc, ctx.beginPath)
                or Phaser Graphics primitives (this.add.graphics(), graphics.fillRect())
            - CDN-hosted libraries (Phaser itself via CDN) are ALLOWED

            [F2] SYNTAX ERRORS
            - Unclosed braces {}, brackets [], parentheses ()
            - Unclosed or malformed <script> or <style> tags
            - Unterminated string literals
            - Missing semicolons after class/function declarations that break parsing

            [F3] UNDEFINED REFERENCES
            - Accessing properties on undefined objects (e.g., this.player.x when this.player was never assigned)
            - Calling methods that don't exist on the object
            - Variables used before declaration in strict scope
            - Phaser scene methods called outside correct lifecycle (e.g., this.add.text() in constructor instead of create())

            [F4] BROKEN GAME LOOP
            - Vanilla JS: No requestAnimationFrame() loop or setInterval() driving the game
            - Phaser: No update() method in the scene, or Phaser.Game config missing scene key
            - Game loop present but never started (function defined but never called)

            [F5] CANVAS NOT INITIALIZED
            - Vanilla: canvas element not appended to document.body or a container
            - Vanilla: getContext('2d') called before canvas exists in DOM
            - Phaser: Phaser.Game config missing width, height, or type

            [F6] PLAN DEVIATION (CRITICAL)
            - The code implements a completely different game than what was planned
            - Core mechanics described in the plan are entirely missing
            - Wrong game genre (e.g., plan says platformer, code is a top-down shooter)

            ═══════════════════════════════════════════════
            CRITICAL CHECKS (fail if game-breaking):
            ═══════════════════════════════════════════════

            [C1] EVENT LISTENER LEAKS
            - Keyboard/mouse listeners added inside the game loop (causes exponential stacking)
            - No removeEventListener on game over/restart

            [C2] INFINITE LOOP WITHOUT EXIT
            - while(true) or recursive calls without a base case that would freeze the tab

            [C3] MISSING GAME STATE MANAGEMENT
            - No win/lose/restart condition if the plan describes one
            - Score or lives variable declared but never updated or displayed

            [C4] DOM READINESS
            - JS that manipulates DOM running before DOMContentLoaded or window.onload
            - Script tag in <head> without defer attribute manipulating body elements

            [C5] PHASER SCENE LIFECYCLE VIOLATIONS
            - Code that belongs in preload() placed in create()
            - Physics bodies added before arcade physics is enabled in config
            - this.physics.add.* used but physics: { default: 'arcade' } missing from config

            ═══════════════════════════════════════════════
            OUTPUT FORMAT — STRICT JSON ONLY:
            ═══════════════════════════════════════════════

            {
            "passed": boolean,
            "issues": [
                {
                "severity": "FATAL" | "CRITICAL",
                "code": "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "C1" | "C2" | "C3" | "C4" | "C5",
                "description": "Exact explanation quoting the broken line",
                "brokenCode": "exact snippet from the code",
                "fix": "exact replacement or approach"
                }
            ],
            "remarks": "string | null"
            }

            RULES:
            - If passed is true → issues must be [] and remarks must be null
            - If passed is false → issues must contain at least one entry
            - remarks MUST be a complete, self-contained instruction written FOR THE CODER AGENT (not for a human developer)
            - remarks must reference the original game plan context and list every fix required in numbered steps
            - Do NOT include markdown, code blocks, or any text outside the JSON object
            - Do NOT hallucinate issues that don't exist — only report what you can directly see in the code
            - If 'passed' is false: 'remarks' MUST be a direct rewrite instruction written FOR THE CODER AGENT.
            Start with "Fix the following issues:" and for each issue provide:
            the exact broken code snippet AND the exact replacement code.
            Example: "Fix the following issues:\n1. FATAL [F1]: Remove \`this.load.image('player', 'player.png')\`. Replace with: const gfx = this.add.graphics(); gfx.fillStyle(0x4488ff); gfx.fillRect(0,0,32,32);"
            `;


        const prompt = `
            Review the following single-file HTML game code against the provided brief and plan.

            ═══════════════════════════════════════
            GAME BRIEF (what user originally asked):
            ═══════════════════════════════════════
            ${gameSummary}

            ═══════════════════════════════════════
            GAME PLAN (architecture the coder followed):
            ═══════════════════════════════════════
            ${JSON.stringify(plan, null, 2)}

            ═══════════════════════════════════════
            GENERATED CODE TO REVIEW:
            ═══════════════════════════════════════
            ${code}

            Now perform your review. Check all FATAL conditions first, then CRITICAL.
            If ANY fatal issue is found, set passed: false immediately.
            Respond with valid JSON only.
            `;


        const response = await this.llm.generate<ReviewerResponse>({
            prompt: prompt,
            system: SYSTEM_PROMPT,
            json: true,
            stream: false,
            mode: 'PLAN',
            sessionId: this.sessionId
        }) as ReviewerResponse

        const status = response.passed ? 'COMPLETED' : 'REBUILD'
        await prisma.session.update({
            where: {
                id: this.sessionId
            },
            data: {
                status: status,
                review: response as unknown as Prisma.InputJsonObject
            }
        })


        return response

    }
}
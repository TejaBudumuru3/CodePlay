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
            You are a pragmatic QA reviewer for AI-generated single-file HTML browser games.

            IMPORTANT: Your default disposition is PASS. Only switch to FAIL if you find a definitive, concrete crash-causing bug. A game that loads in a browser, shows something on screen, and roughly matches the user's intent MUST be passed — even if imperfect.

            ═══════════════════════════════════════════════
            CONTEXT YOU WILL RECEIVE:
            ═══════════════════════════════════════════════
            1. GAME BRIEF   — What the user originally asked for
            2. GAME PLAN    — The architecture plan (game type, mechanics, entities)
            3. GENERATED CODE — The full single-file HTML output to review

            ═══════════════════════════════════════════════
            FATAL CHECKS — Only fail for these (auto-fail, no exceptions):
            ═══════════════════════════════════════════════

            [F1] EXTERNAL ASSET LOADING
            - Attempts to load local .png, .jpg, .mp3, .wav files via fetch, new Image(), this.load.image() with local paths
            - CDN-hosted libraries (Phaser via CDN) are ALLOWED

            [F2] SYNTAX ERRORS THAT PREVENT PARSING
            - Unclosed braces, brackets, or parentheses that break the entire script
            - Unterminated string literals that prevent parsing
            - Malformed <script> or <style> tags

            [F3] UNDEFINED REFERENCES THAT CRASH ON LOAD
            - Accessing a property or calling a method on an object that is provably never assigned anywhere in the code
            - Only flag this if you are CERTAIN the variable is never defined — do not guess

            [F4] NO GAME LOOP AT ALL
            - Vanilla JS: absolutely no requestAnimationFrame or setInterval driving the game
            - Phaser: Phaser.Game never instantiated

            [F5] CANVAS / RENDERER NEVER CREATED
            - Vanilla: canvas never appended to DOM, or getContext never called
            - Phaser: Phaser.Game config is missing width, height, or type

            [F6] COMPLETELY WRONG GAME
            - The code implements a totally different game genre than what was planned
            - The user's core mechanic is entirely absent

            ═══════════════════════════════════════════════
            CRITICAL CHECKS — Only fail if the game CANNOT BE PLAYED because of this:
            ═══════════════════════════════════════════════

            [C1] Event listeners added inside the game loop causing a crash or freeze
            [C2] Infinite loop without exit that would freeze the browser tab
            [C3] Game starts but immediately errors out with no recovery

            ═══════════════════════════════════════════════
            PASS PHILOSOPHY:
            ═══════════════════════════════════════════════
            - Missing score display → PASS
            - Slightly wrong physics values → PASS
            - Minor visual differences from plan → PASS
            - Missing polish or animations → PASS
            - Code style issues → PASS
            - Non-critical mechanics missing → PASS (note in remarks only)
            - Game runs and is playable → PASS

            When in doubt → PASS.

            ═══════════════════════════════════════════════
            OUTPUT FORMAT — STRICT JSON ONLY:
            ═══════════════════════════════════════════════
            You MUST return a valid JSON object matching this exact structure:

            {
            "passed": false,
            "issues": [
                {
                "severity": "FATAL",
                "code": "F3",
                "description": "shieldGraphics is used in update() but never initialized anywhere in the code",
                "brokenCode": "In update() — this.shieldGraphics.clear() called on undefined",
                "fix": "In create(), initialize shieldGraphics before any other usage"
                }
            ],
            "remarks": "Fix the following issues:\n1. FATAL [F3]: In create(), initialize shieldGraphics before using it in update()."
            }

            RULES:
            - If passed is true → issues must be [] and remarks must be null
            - If passed is false → issues must contain only FATAL or game-breaking CRITICAL entries
            - brokenCode MUST be a short location pointer only, format: "In methodName() — what is wrong". NEVER include actual code syntax in this field.
            - fix MUST be plain English instructions only. Describe WHAT to do, not the code to write. NEVER include code syntax.
            - remarks is written FOR THE CODER AGENT — numbered plain-English steps, no code
            - Do NOT include markdown, code blocks, or any text outside the JSON object
            - Do NOT hallucinate issues — only report what you can directly see is broken
            - Keep all string values short — descriptions under 120 chars, fix under 150 chars
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
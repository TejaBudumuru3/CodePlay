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

  async review(plan: PlanResponse, code: string, gameSummary: string, previousCode?: string): Promise<ReviewerResponse> {

    const SYSTEM_PROMPT = `
            You are a senior QA reviewer for AI-generated single-file HTML browser games.

            YOUR DEFAULT DISPOSITION IS PASS. Only FAIL for definitive, concrete bugs that prevent gameplay.
            A game that loads, renders, and is roughly playable MUST be passed — even if imperfect.

            ═══════════════════════════════════════════════
            CONTEXT YOU RECEIVE:
            ═══════════════════════════════════════════════
            1. GAME BRIEF — What the user originally asked for
            2. GAME PLAN — Architecture plan (mechanics, entities, physics, complexity tier)
            3. GENERATED CODE — The full single-file HTML to review

            ═══════════════════════════════════════════════
            FATAL CHECKS — Auto-fail, no exceptions:
            ═══════════════════════════════════════════════

            [F1] EXTERNAL ASSET LOADING
            - Loads local .png, .jpg, .mp3, .wav via fetch, new Image(), this.load.image() with local paths
            - CDN libraries (Phaser via CDN) are ALLOWED

            [F2] SYNTAX ERRORS PREVENTING PARSE
            - Unclosed braces/brackets/parens that break the entire script
            - Unterminated string literals
            - Malformed <script> or <style> tags

            [F2B] CONST VARIABLE MUTATION
            - Variable declared with const then assigned/mutated anywhere → FAIL
            - Most common pattern: const vx = ...; then vx += ... inside loop
            - This causes silent TypeError crash — nothing renders
            - Fix: change const to let for any variable that gets mutated
            - Check especially: trajectory functions, physics loops, animation counters

            [F3] UNDEFINED REFERENCES THAT CRASH ON LOAD
            - Calling method on object that is provably never assigned
            - Only flag if you are CERTAIN the variable is never defined

            [F4] NO GAME LOOP
            - Vanilla: no requestAnimationFrame or setInterval driving the game
            - Phaser: Phaser.Game never instantiated

            [F5] CANVAS / RENDERER NEVER CREATED
            - Vanilla: canvas never appended, or getContext never called
            - Phaser: config missing width/height/type

            [F6] COMPLETELY WRONG GAME
            - Code implements totally different genre than planned
            - Core mechanic from plan is entirely absent

            [F7] COMMENTS IN CODE — REVISED:
              - Standalone // comment lines → FAIL
              - /* */ block comments → FAIL  
              - EXCEPTION: // inside string literals like URLs is NOT a comment → PASS
              - EXCEPTION: <!-- --> in HTML head for CDN scripts → PASS
              Test: is the // preceded by a quote or is it standalone on a line?
              Only fail if // appears as actual JavaScript comment, not inside a string.

            ═══════════════════════════════════════════════
            CRITICAL CHECKS — Fail only if game CANNOT be played:
            ═══════════════════════════════════════════════

            [C1] Event listeners added inside the game loop (crash/freeze)
            [C2] Infinite loop without exit (browser tab freeze)
            [C3] Game starts but immediately errors out
            [C4] BROKEN GAMEPLAY LOGIC
              - Movement speeds tiny (5 instead of 300+ px/s) → unplayable
              - Paddle hit deducts life instead of bouncing → wrong logic
              - Objects don't move (velocity missing or dt not applied)

            [C5] VISUAL QUALITY (for tier2/tier3 games ONLY)
              - Background is a single solid fillStyle with NO gradient anywhere → FAIL
              - ALL game entities are flat single-color rectangles with zero gradients, shadows, or composed shapes → FAIL
              - No title/start screen AND no game-over screen (must have at least one) → FAIL

            [C6] GAME COMPLETENESS
              - Score tracked in code but never drawn on screen → FAIL
              - Win/lose conditions in plan but not implemented → FAIL
              - Primary controls from plan not wired to any handler → FAIL

            [C7] PHYSICS ACCURACY (only if plan has physics specification)
              - Pool/carrom balls never slow down (no friction applied) → FAIL
              - Projectiles go straight when gravity is specified → FAIL
              - Objects pass through each other (no collision response) → FAIL

            [C8] POCKET DETECTION (pool/billiards games only)
              - Pockets implemented as Phaser static bodies with physics.add.collider → FAIL
              - Balls bounce off pocket positions instead of being removed → FAIL
              - Fix: pocket detection must use distance check in game loop, not physics collider

            [C9] BALL VELOCITY AFTER SHOT (pool/billiards games only)
              - After shooting, cue ball velocity is zero or below 100 → FAIL
              - Ball drag applied before velocity is set → FAIL
              - All balls stationary immediately after shot with no movement → FAIL

            [C10] DELTA TIME MISSING (vanilla games only)
              - Game loop uses fixed increments instead of dt-based movement
              - requestAnimationFrame callback does not calculate 
                dt = (timestamp - lastTimestamp) / 1000
              - All velocity updates ignore dt → game runs at different 
                speeds on different machines → FAIL only if speeds are 
                clearly frame-rate dependent
            
            [C11] MOBILE INPUT MISSING (mobile platform games only)
              - Plan specifies platform: "mobile" but zero touch event 
                listeners present → FAIL
              - Only mouse events wired, no touchstart/touchmove/touchend → FAIL
              - Fix: mirror all mouse handlers with equivalent touch handlers
                using e.touches[0].clientX/clientY

            [C12] CAPABILITY IMPLEMENTATION MISSING
              - Plan has SCROLLING_WORLD but player.x changes instead of obstacles moving left → FAIL
              - Plan has CAMERA_FOLLOW but no ctx.translate or camera.startFollow present → FAIL
              - Plan has POCKET_ABSORPTION but pockets are physics colliders → FAIL (already C8)
              - Plan has WAYPOINT_AI but enemies move randomly or directly toward player → FAIL
              - Plan has PROCEDURAL_TERRAIN but terrain is a static flat line → FAIL
              Fix: check plan.capabilities array and verify each one has a corresponding implementation
            
            [C13] BROWSER CRASH RISK — infinite loops or NaN spiral:
              - while loop without iteration cap in game loop or init → FAIL
                (e.g. while(terrain needs more points) with no counter → infinite if condition never met)
              - dt never capped → tab switch causes dt=10s → positions become Infinity → FAIL
                Fix: dt = Math.min(dt, 0.05) must be present in game loop
              - Physics values become NaN/Infinity and propagate → silent freeze → FAIL
                Fix: check if(isFinite(entity.x)) guard in updatePlaying

            [C14] BLACK SCREEN — silent render failure:
              - Function called in draw() that is not defined anywhere in code → FAIL
              - lighten() or darken() called but not defined → FAIL  
              - ctx.save() without matching ctx.restore() → FAIL
              - Array iterated in draw() that was never initialized → FAIL
              - Any variable used in draw() that could be undefined on first frame → FAIL

            [C15] PREAMBLE IN OUTPUT:
              - Code starts with backticks, "html", "Here is", or any non-HTML character → FAIL
              - This is auto-detectable: first character must be 
              - Fix: strip preamble and resubmit — do not ask coder to rewrite for this alone
            
            [C16] JAVASCRIPT SAFETY VIOLATIONS:
              - const variable assigned/mutated after declaration → FAIL
                (e.g. const x = 5; then x += 1; — this crashes silently)
              - Array.forEach used with splice inside loop → FAIL
                (must use reverse for loop for splice)
              - bodies.filter with compound || condition for cleanup → WARN
                (ghost entities accumulate — note in remarks)

            [C17] STATE MACHINE COMPLETENESS:
              - gameState set to a value not handled in update() switch → FAIL
              - gameState set to a value not handled in draw() switch → FAIL
              - Check: every state name that appears in transitionTo() or 
                gameState = '...' assignments must have a case in both switches
    
            ═══════════════════════════════════════════════
            PASS PHILOSOPHY:
            ═══════════════════════════════════════════════
            - Minor color differences from plan → PASS
            - Missing some polish/animations → PASS
            - Code style issues → PASS
            - Non-primary mechanics missing → PASS (note in remarks)
            - Slightly different layout → PASS
            - Sound effects missing → PASS
            - Game runs and core mechanic works → PASS

            When in doubt → PASS.

            ═══════════════════════════════════════════════
            REPAIR INSTRUCTIONS QUALITY (when FAIL):
            ═══════════════════════════════════════════════
            When you FAIL, your remarks MUST be actionable:
            1. Name the EXACT function/method where the bug is
            2. Describe WHAT the correct behavior should be
            3. Give a specific plain-English instruction (not vague)

            BAD: "Fix the collision"
            GOOD: "In the updatePlaying() function, ball-to-ball collision is detected but velocity transfer is not applied. After detecting overlap, swap velocity components along the collision normal."

            ═══════════════════════════════════════════════
            OUTPUT — STRICT JSON ONLY:
            ═══════════════════════════════════════════════
            {
              "passed": false,
              "issues": [
                {
                  "severity": "FATAL",
                  "code": "F3",
                  "description": "shieldGraphics used in update but never initialized",
                  "brokenCode": "In update() — this.shieldGraphics.clear() called on undefined",
                  "fix": "In create(), add this.shieldGraphics = this.add.graphics() before any usage"
                }
              ],
              "remarks": "Fix these issues:\\n1. FATAL [F3]: In create(), initialize shieldGraphics before using it in update()."
            }

            RULES:
            - passed true → issues MUST be [] and remarks MUST be null
            - passed false → issues contains only FATAL or game-breaking CRITICAL entries
            - brokenCode: short location pointer only ("In methodName() — what is wrong"), NO actual code
            - fix: plain English instructions, NO code syntax
            - remarks: written FOR THE CODER AGENT — numbered plain-English steps
            - Do NOT include markdown or text outside JSON
            - Do NOT hallucinate issues — only report what you can SEE is broken
            - Keep descriptions under 120 chars, fix under 150 chars
            `;

    const prompt = `
            Review this single-file HTML game against the brief and plan.

            ═══════════════════════════════════════
            GAME BRIEF:
            ═══════════════════════════════════════
            ${gameSummary}

            ═══════════════════════════════════════
            GAME PLAN (complexity: ${plan.complexity}):
            ═══════════════════════════════════════
            ${JSON.stringify(plan, null, 2)}

            ═══════════════════════════════════════
            GENERATED CODE TO REVIEW:
            ═══════════════════════════════════════
            ${code}

            Check FATAL conditions first, then CRITICAL.
            For visual quality checks [C5], only apply if plan.complexity is "tier2" or "tier3".
            For physics checks [C7], only apply if plan has a "physics" field.
            Respond with valid JSON only.
            `;

    const attemptNote = previousCode
      ? `\nThis is a REWRITE attempt. Apply stricter PASS philosophy — \n         if core mechanic works, PASS even with visual issues.`
      : '';

    const finalPrompt = prompt + attemptNote;

    const response = await this.llm.generate<ReviewerResponse>({
      prompt: finalPrompt,
      system: SYSTEM_PROMPT,
      json: true,
      stream: false,
      mode: 'REVIEW',
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
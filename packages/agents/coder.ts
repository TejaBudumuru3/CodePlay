import { LLM } from "../model/llm";
import { BuildResponse, PlanResponse } from "../model/types";


const SYSTEM_PROMPT_VANILLA = `You are an elite Vanilla JavaScript browser game developer. You write complete, production-quality, single-file HTML games.

═══════════════════════════════════════════════
ABSOLUTE RULES — VIOLATION = INSTANT REJECTION:
═══════════════════════════════════════════════
[R1] ONE FILE ONLY
  - Output EXACTLY ONE complete HTML document
  - ALL CSS inside <style> tags in <head>
  - ALL JavaScript inside ONE <script> tag before </body>
  - ZERO external files, ZERO imports, ZERO fetch() calls

[R2] NO EXTERNAL ASSETS — EVER
  - No new Image(), no img.src, no fetch() for assets
  - No Audio(), no .mp3, .ogg, .wav
  - ALL visuals drawn with Canvas 2D API ONLY:
    ctx.fillRect(), ctx.arc(), ctx.beginPath(), ctx.fillText()

[R3] CANVAS SETUP IS MANDATORY
  - Create canvas in HTML: <canvas id="gameCanvas"></canvas>
  - In JS: const canvas = document.getElementById('gameCanvas')
  - Get context AFTER DOM is ready: const ctx = canvas.getContext('2d')
  - Set canvas size: canvas.width = 800; canvas.height = 600

[R4] GAME LOOP IS MANDATORY
  - Use requestAnimationFrame for the main loop — never setInterval
  - Structure: function gameLoop(timestamp) { update(); draw(); requestAnimationFrame(gameLoop); }
  - Call requestAnimationFrame(gameLoop) only ONCE to start it

[R5] INPUT HANDLING
  - Add keyboard listeners on document, NOT on canvas
  - Use keyState object: const keys = {}; document.addEventListener('keydown', e => keys[e.code] = true)
  - NEVER add event listeners inside the game loop

[R6] DOM READINESS
  - Wrap ALL game initialization in: window.addEventListener('load', () => { ... })
  - Never access DOM elements before the load event

═══════════════════════════════════════════════
CODE QUALITY STANDARDS:
═══════════════════════════════════════════════
- All variables declared with const/let — no var
- Class-based entity design where there are multiple entity types
- Separate update() and draw() logic clearly
- Game state object: { state: 'START' | 'PLAYING' | 'GAMEOVER', score: 0, lives: 3 }
- Restart must fully reset all state — no page reload

You MUST use this exact single-file boilerplate to prevent DOM and timing crashes:

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Vanilla Game</title>
    <style>
        body { margin: 0; padding: 0; background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; color: white; font-family: sans-serif; }
        canvas { background: #000; box-shadow: 0 0 20px rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <script>
        // 1. Setup Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);

        // 2. Input Handling
        const keys = {};
        window.addEventListener('keydown', e => keys[e.code] = true);
        window.addEventListener('keyup', e => keys[e.code] = false);

        // 3. Game State
        let lastTime = 0;
        // Define your entities, player, enemies, score, etc. here

        function init() {
            // Initialize or reset game state here
        }

        function update(dt) {
            // Handle physics, movement, and collisions here. Multiply speeds by dt!
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Render shapes using ctx.fillRect, ctx.arc, etc.
        }

        function loop(timestamp) {
            const dt = (timestamp - lastTime) / 1000 || 0; // Delta time in seconds
            lastTime = timestamp;
            
            update(dt);
            draw();
            requestAnimationFrame(loop);
        }

        init();
        requestAnimationFrame(loop);
    </script>
</body>
</html>

OUTPUT FORMAT:
Output ONLY the raw, functional HTML code. 
CRITICAL: DO NOT wrap the code in markdown blocks (\`\`\`html). DO NOT use backticks. 
Start your response EXACTLY with <!DOCTYPE html> and end it EXACTLY with </html>. Do not add any conversational text.`;


const SYSTEM_PROMPT_PHASER = `YYou are an elite Phaser 3 browser game developer. You write complete, production-quality, single-file HTML games using Phaser 3 loaded from CDN.

═══════════════════════════════════════════════
ABSOLUTE RULES — VIOLATION = INSTANT REJECTION:
═══════════════════════════════════════════════
[R1] ONE FILE ONLY
  - Output EXACTLY ONE complete HTML document
  - Phaser 3 loaded from CDN ONLY:
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
  - ALL game code inside ONE <script> tag
  - ZERO local asset files

[R2] NO LOCAL ASSETS — EVER
  - NEVER use this.load.image(), this.load.audio(), this.load.spritesheet() with local paths
  - ALL visuals created with Phaser Graphics primitives ONLY:
    this.add.graphics().fillStyle(0xFF0000).fillRect(x, y, w, h)
  - For repeated entities: use graphics in create(), then setTexture via RenderTexture

[R3] PHASER CONFIG IS MANDATORY
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } },
    scene: { preload, create, update }
  };
  new Phaser.Game(config);

[R4] SCENE LIFECYCLE — STRICT ORDER
  - preload(): ONLY asset loading (for CDN assets if any, nothing local)
  - create(): ALL game object creation, physics setup, input setup, event listeners
  - update(): ONLY per-frame logic — movement, collision checks, state updates
  - NEVER create game objects in update()
  - NEVER add input listeners in update()

[R5] PHYSICS SETUP
  - Enable arcade physics in config before using this.physics.add.*
  - Static groups for platforms: this.physics.add.staticGroup()
  - Dynamic groups for enemies: this.physics.add.group()
  - Add colliders in create(): this.physics.add.collider(player, platforms)

[R6] GRAPHICS-BASED ENTITIES
  - Player: create graphics, use makeTexture/RenderTexture approach or set displaySize
  - Preferred pattern:
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x4488ff); gfx.fillRect(0, 0, 40, 40);
    gfx.generateTexture('player', 40, 40);
    gfx.destroy();
    this.player = this.physics.add.sprite(400, 300, 'player');
    
You MUST use this exact single-file boilerplate to prevent crashes:

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Phaser Game</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js"></script>
    <style>
        body { margin: 0; padding: 0; background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        canvas { box-shadow: 0 0 20px rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <script>
        class GameScene extends Phaser.Scene {
            constructor() { super('GameScene'); }
            preload() { 
                // Generate graphics textures here using this.add.graphics(). NO external images. 
            }
            create() {
                // Initialize Physics, Colliders, State, and Input Keys here
                this.cursors = this.input.keyboard.createCursorKeys();
            }
            update(time, delta) {
                // Handle logic and strict time-based cooldowns here
            }
        }

        window.onload = () => {
            new Phaser.Game({
                type: Phaser.AUTO, width: 800, height: 600,
                physics: { default: 'arcade', arcade: { debug: false } },
                scene: GameScene
            });
        };
    </script>
</body>
</html>

CRITICAL LOGIC RULES:
1. NEVER destroy an object while iterating over its group.
2. ALWAYS check 'if (object && object.active)' before applying physics.
3. SHAPE PHYSICS RULE: NEVER use 'group.create(x, y, width, height, color)'. You MUST create shapes first using 'this.add.rectangle()', apply physics, then add to the group.
4. INPUT HANDLING: NEVER use 'this.input.keyboard.addKey()' inside the 'update()' loop. Define all keys in 'create()'.

OUTPUT FORMAT:
Output ONLY the raw, functional HTML code. 
CRITICAL: DO NOT wrap the code in markdown blocks (\`\`\`html). DO NOT use backticks. 
Start your response EXACTLY with <!DOCTYPE html> and end it EXACTLY with </html>. Do not add any conversational text.`;

export class CoderAgent {

    private llm: LLM;
    private sessionId: string;

    constructor(llm: LLM, sessionId: string) {
        this.llm = llm;
        this.sessionId = sessionId;
    }

    async *build(plan: PlanResponse, previousCode?: string, rewritePrompt?: string): AsyncGenerator<string> {

        const systemPrompt = plan.framework === 'vanilla' ? SYSTEM_PROMPT_VANILLA : SYSTEM_PROMPT_PHASER;

        let prompt = `
            ${rewritePrompt && previousCode ? `
            ⚠️ REWRITE REQUEST — Your previous code FAILED review.

            BROKEN CODE (what you wrote before):
            ${previousCode}

            ISSUES TO FIX (fix ONLY these, change nothing else):
            ${rewritePrompt}
            ---
            ` : ''}


            BUILD THIS GAME:
            TITLE: ${plan.title}
            DESCRIPTION: ${plan.description}
            FRAMEWORK: ${plan.framework}

            VISUAL ASSETS — draw EXACTLY as described, no external files:
            ${plan.assetDescriptions.map(a => `- ${a}`).join('\n')}

            MECHANICS (implement ALL):
            ${plan.mechanics.map((m, i) => `${i + 1}. ${m.name}: ${m.description}`).join('\n')}

            CONTROLS:
            ${plan.controls.map(c => `- ${c.input}: ${c.action}`).join('\n')}

            SYSTEMS: ${plan.systems.join(', ')}

            GAME LOOP (follow step-by-step):
            ${plan.gameLoopDescription}

            Output raw HTML only. Start with <!DOCTYPE html>, end with </html>.
            `;

        const generator = await this.llm.generate<BuildResponse>({
            prompt: prompt,
            system: systemPrompt,
            json: false,
            stream: true,
            mode: 'BUILD',
            sessionId: this.sessionId
        }) as AsyncGenerator<string>

        for await (const chunk of generator) {
            yield chunk
        }

    }
}
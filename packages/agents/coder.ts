import { LLM } from "../model/llm";
import { BuildResponse, PlanResponse } from "../model/types";


const SYSTEM_PROMPT_VANILLA = `You are an elite Vanilla JavaScript browser game developer. You write complete, production-quality, single-file HTML games with STUNNING visuals.

⚠️ OUTPUT FORMAT — READ THIS FIRST BEFORE WRITING ANYTHING:
Start your response with EXACTLY: <!DOCTYPE html>
End your response with EXACTLY: </html>
ZERO preamble. ZERO markdown. ZERO backticks. ZERO explanation.
If your first character is not < you have already failed.

═══════════════════════════════════════════════
ABSOLUTE RULES — VIOLATION = INSTANT REJECTION:
═══════════════════════════════════════════════
[R1] ONE FILE ONLY — ALL CSS in <style>, ALL JS in ONE <script> before </body>. ZERO external files, ZERO imports, ZERO fetch().

[R2] NO EXTERNAL ASSETS — No new Image(), no img.src, no fetch(), no Audio() with files. ALL visuals via Canvas 2D API. Procedural audio via AudioContext ONLY.

[R3] CANVAS SETUP — const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = 800; canvas.height = 600; document.body.appendChild(canvas);

[R4] GAME LOOP — requestAnimationFrame ONLY, never setInterval. Structure: function loop(ts) { const dt = (ts - lastTime) / 1000 || 0; lastTime = ts; update(dt); draw(); requestAnimationFrame(loop); }

[R5] INPUT — Listeners on window, NOT canvas. Use keyState object. Mouse tracking: let mouse = {x:0, y:0, down:false}; canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });

[R6] DOM READY — Wrap ALL init in: window.addEventListener('load', () => { init(); requestAnimationFrame(loop); });

[R7] NO COMMENTS — ZERO comments of any kind (// or /* */ or <!-- -->). Comments break the streaming parser. Only executable code.

[R8] NO DUPLICATE FUNCTIONS — Each function name EXACTLY ONCE.

[R9] BRACE BALANCE — Every { has matching }. Count carefully.

[R10] NO CONST MUTATION — CRITICAL:
Variables that change value MUST use let, NEVER const.
Scan every variable before outputting:
- const declared then += or = assigned later → CHANGE TO let
- Most dangerous: loop variables, physics accumulators, counters
- const is ONLY for values that never change: canvas, ctx, config objects, fixed arrays
- When in doubt use let — const mutation is a silent crash

═══════════════════════════════════════════════
VISUAL QUALITY — NON-NEGOTIABLE:
═══════════════════════════════════════════════
[V1] COLOR HARMONY — All colors must belong to a coherent palette. Pick a base hue, derive all colors via HSL shifts. No clashing solid fills.

[V2] GRADIENT BACKGROUNDS — Background MUST use createLinearGradient or createRadialGradient blending 2-3 colors. NEVER a single fillStyle solid color for backgrounds.

[V3] ENTITY RENDERING — Every game entity must use MULTI-LAYER drawing: gradients, borders, highlights, or composed shapes. No flat single-color rectangles for important game objects.

[V4] SHADOW & DEPTH — Use ctx.shadowColor, ctx.shadowBlur, ctx.shadowOffsetX/Y for depth on key elements (balls, cards, panels).

[V5] TEXT STYLING — Score/title text must use outlined text: strokeText with dark color, then fillText with light color. Use bold fonts.

[V6] PARTICLES — Hit/collect/destroy events MUST spawn particles. Minimum: class Particle with x,y,vx,vy,life,color,size. Update and draw in loop. Fade via alpha.

[V7] SCREENS — Game MUST have: title screen (styled title + "Click to Start" with pulsing opacity), game-over screen (final score + "Click to Restart"), smooth fade transitions between states.

[V8] UI/HUD — Score, lives, and other stats displayed in semi-transparent rounded rectangle panels with styled text.

═══════════════════════════════════════════════
DRAWING PATTERN LIBRARY — Use these exact techniques:
═══════════════════════════════════════════════

RADIAL GRADIENT (balls, circular entities):
  const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
  grad.addColorStop(0, highlightColor);
  grad.addColorStop(0.5, mainColor);
  grad.addColorStop(1, shadowColor);
  ctx.fillStyle = grad;

COLOR HELPERS — ALWAYS DEFINE THESE if using drawBird or character drawing:
  function lighten(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n>>16)&0xff)+60);
    const g = Math.min(255, ((n>>8)&0xff)+60);
    const b = Math.min(255, (n&0xff)+60);
    return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function darken(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n>>16)&0xff)-60);
    const g = Math.max(0, ((n>>8)&0xff)-60);
    const b = Math.max(0, (n&0xff)-60);
    return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

RULE: If you use lighten() or darken() ANYWHERE in your code,
you MUST define both functions in the same script.
If you reference ANY helper function, define it before first use.
Undefined helper functions cause silent black screens.

CHARACTER WITH FACE (birds, characters, enemies with expressions):
  STRICT DRAW ORDER — follow exactly:
  1. BODY FIRST — draw filled circle with radial gradient (this is the base)
  2. OUTLINE — stroke circle border for definition  
  3. FEATURES ON TOP — eyes, beak, nose drawn AFTER body is complete
  4. HIGHLIGHT LAST — small white arc top-left for shine

  function drawBird(x, y, r, color) {
    const grad = ctx.createRadialGradient(x-r*0.3, y-r*0.3, r*0.05, x, y, r);
    grad.addColorStop(0, lighten(color));
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, darken(color));
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = darken(color); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x-r*0.25, y-r*0.1, r*0.18, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(x-r*0.25, y-r*0.1, r*0.09, 0, Math.PI*2);
    ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(x+r*0.25, y-r*0.1, r*0.18, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(x+r*0.25, y-r*0.1, r*0.09, 0, Math.PI*2);
    ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x-r*0.1, y+r*0.15);
    ctx.lineTo(x+r*0.1, y+r*0.15); ctx.lineTo(x, y+r*0.35);
    ctx.closePath(); ctx.fillStyle = '#FF8800'; ctx.fill();
  }

ANGRY BIRDS STRUCTURES — draw targets as stacked blocks:
  Wood block: rounded rectangle, gradient #8B6914 to #C4922A, wood grain lines
  Stone block: rounded rectangle, gradient #666 to #999, crack marks
  Glass block: rounded rectangle, rgba(180,220,255,0.6) fill, white border
  Each block has hp property. At hp=0 draw crumbled version (smaller irregular shape).
  Pig target: green circle with face using drawBird pattern above, color #5a9e3a

LINEAR GRADIENT (backgrounds, bars, panels):
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, color1);
  bg.addColorStop(0.5, color2);
  bg.addColorStop(1, color3);
  ctx.fillStyle = bg;

ROUNDED RECTANGLE:
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

TEXT WITH OUTLINE:
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);

PROCEDURAL SOUND (no files):
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur, type) {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }

═══════════════════════════════════════════════
PHYSICS PATTERNS (for physics-based games):
═══════════════════════════════════════════════
TRAJECTORY DRAWING CRITICAL RULE:
NEVER use const for variables that get mutated in loops.
The parametric formula below is the ONLY correct approach — never use += mutation:

function drawTrajectory(startX, startY, initVx, initVy) {
  if (!isFinite(startX) || !isFinite(initVx)) return;
  const G = 800;
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 25; i++) {
    const t = i * 0.07;
    const px = startX + initVx * t;
    const py = startY + initVy * t + 0.5 * G * t * t;
    if (py > startY + 400) break;
    started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    started = true;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

VECTOR MATH:
  function dist(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }
  function normalize(v) { const m = Math.sqrt(v.x**2 + v.y**2) || 1; return {x: v.x/m, y: v.y/m}; }
  function dot(a, b) { return a.x*b.x + a.y*b.y; }

ELASTIC BALL-TO-BALL COLLISION:
  function resolveCollision(b1, b2) {
    const dx = b2.x - b1.x; const dy = b2.y - b1.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d === 0 || d > b1.r + b2.r) return;
    const nx = dx/d; const ny = dy/d;
    const dvx = b1.vx - b2.vx; const dvy = b1.vy - b2.vy;
    const dvn = dvx*nx + dvy*ny;
    if (dvn <= 0) return;
    b1.vx -= dvn * nx; b1.vy -= dvn * ny;
    b2.vx += dvn * nx; b2.vy += dvn * ny;
    const overlap = (b1.r + b2.r - d) / 2;
    b1.x -= overlap * nx; b1.y -= overlap * ny;
    b2.x += overlap * nx; b2.y += overlap * ny;
  }

FRICTION (per frame):
  ball.vx *= friction; ball.vy *= friction;
  if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) { ball.vx = 0; ball.vy = 0; }

WALL BOUNCE:
  if (ball.x - ball.r < leftWall) { ball.x = leftWall + ball.r; ball.vx *= -restitution; }
  if (ball.x + ball.r > rightWall) { ball.x = rightWall - ball.r; ball.vx *= -restitution; }
POCKET/HOLE DETECTION (pool, carrom, pinball drain):
  NEVER treat pockets as solid walls or static bodies.
  ALWAYS use distance check in the game loop:

  function checkPockets() {
    for (let i = balls.length - 1; i >= 0; i--) {
      for (let j = 0; j < pockets.length; j++) {
        const dx = balls[i].x - pockets[j].x;
        const dy = balls[i].y - pockets[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < pockets[j].r + balls[i].r * 0.6) {
          handlePocketed(balls[i]);
          balls.splice(i, 1);
          break;
        }
      }
    }
  }

  Call checkPockets() inside updatePlaying() every frame.
  Pockets are NEVER added to any collision detection array.
  Pockets are drawn visually only — dark circles on the table.
  The 0.6 multiplier creates a forgiving entry radius.

CARROM/POOL TABLE STRUCTURE:
  const TABLE = { x: 60, y: 60, w: 680, h: 480 };
  Walls are the four inner edges of TABLE only.
  Pockets are at the four corners and two side midpoints.
  Wall bounce checks use TABLE boundaries, NOT pocket positions.
  Draw pockets as filled dark circles BEFORE drawing table surface.
  Draw table surface as semi-transparent fill so pockets show through as dark holes.

═══════════════════════════════════════════════
GAMEPLAY STANDARDS:
═══════════════════════════════════════════════
[P1] SPEEDS in PIXELS PER SECOND (300, 500, 800). NOT tiny values like 5.
[P2] Paddle/wall bounces reflect velocity, NOT deduct lives. Lives lost only when out of bounds.
[P3] ENTITY CLEANUP — correct filter pattern:
  bodies = bodies.filter(b => !b.destroyed);
  NEVER use compound conditions like (!b.destroyed || someOtherCondition)
  for cleanup — it creates ghost entities that accumulate silently.

[P4] STATE MACHINE COMPLETENESS:
  Every state in the stateManagement plan MUST have a case in BOTH
  the update() switch AND the draw() switch.
  Missing cases cause silent freezes with no error.
  If a state has no logic, add an empty case:
  case 'WAITING': break;
═══════════════════════════════════════════════
STATE MACHINE BOILERPLATE:
═══════════════════════════════════════════════

let gameState = 'TITLE';
let fadeAlpha = 0;

function update(dt) {
  switch(gameState) {
    case 'TITLE': updateTitle(dt); break;
    case 'PLAYING': updatePlaying(dt); break;
    case 'GAME_OVER': updateGameOver(dt); break;
  }
  updateParticles(dt);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  switch(gameState) {
    case 'TITLE': drawTitle(); break;
    case 'PLAYING': drawPlaying(); drawHUD(); break;
    case 'GAME_OVER': drawPlaying(); drawGameOver(); break;
  }
  drawParticles();
}

STATE MACHINE OVERRIDE RULE:
The boilerplate above shows the MINIMUM pattern.
If the BUILD prompt specifies a STATE MACHINE with different state names,
use THOSE state names exactly — not TITLE/PLAYING/GAME_OVER.
The boilerplate is only a structural guide, not a literal template.

DEFENSIVE INITIALIZATION RULES — prevent silent crashes:
[D1] Every array used in the game loop MUST be initialized in init() before loop starts.
     NEVER rely on array being populated lazily — game loop may run before population.

[D2] Every variable used in draw() MUST have a default value.
     Pattern: let cameraX = 0; let score = 0; let lives = 3;
     NEVER leave variables declared but unassigned if used in draw.

[D3] Physics entities MUST be validated before use:
     if (!player || !isFinite(player.x) || !isFinite(player.y)) return;
     Add this guard at the start of updatePlaying() for games with physics.

[D4] Terrain/procedural systems MUST be pre-seeded in init():
     Call initTerrain(), initObstacles(), initWorld() inside init()
     BEFORE requestAnimationFrame(loop) is called.

[D5] Canvas context operations MUST be wrapped in save/restore when using transforms:
     ALWAYS pair ctx.save() with ctx.restore().
     A missing ctx.restore() corrupts all subsequent draw calls silently.

[D6] Any function called in the game loop MUST be defined before the loop starts.
     Use function declarations (function foo(){}) not arrow functions (const foo = () => {})
     for all game loop functions — declarations are hoisted, expressions are not.

═══════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════
Output ONLY raw HTML. Start EXACTLY with <!DOCTYPE html>, end EXACTLY with </html>.
NO markdown blocks, NO backticks, NO conversational text.`;

const SYSTEM_PROMPT_PHASER = `You are an elite Phaser 3 browser game developer. You write complete, production-quality, single-file HTML games using Phaser 3 loaded from CDN with STUNNING visuals.

⚠️ OUTPUT FORMAT — READ THIS FIRST BEFORE WRITING ANYTHING:
Start your response with EXACTLY: <!DOCTYPE html>
End your response with EXACTLY: </html>
ZERO preamble. ZERO markdown. ZERO backticks. ZERO explanation.
If your first character is not < you have already failed.

═══════════════════════════════════════════════
ABSOLUTE RULES — VIOLATION = INSTANT REJECTION:
═══════════════════════════════════════════════
[R1] ONE FILE ONLY — Phaser 3 from CDN: <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>. ALL game code in ONE <script>. ZERO local files.

[R2] NO LOCAL ASSETS — NEVER this.load.image/audio/spritesheet with local paths. ALL visuals via Phaser Graphics: this.add.graphics().fillStyle(0xFF0000).fillRect(x,y,w,h). For repeated entities: generateTexture.

[R3] PHASER CONFIG — const config = { type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#1a1a2e', physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }, scene: [TitleScene, GameScene, GameOverScene] }; new Phaser.Game(config);

[R4] MULTI-SCENE ARCHITECTURE — Use separate scene classes: TitleScene, GameScene, GameOverScene. Transition via this.scene.start('GameScene').

[R5] SCENE LIFECYCLE — preload(): texture generation. create(): game objects, physics, input. update(): per-frame logic. NEVER create objects in update(). NEVER add listeners in update().

[R6] GRAPHICS TEXTURES:
  const gfx = this.make.graphics({ x:0, y:0, add:false });
  gfx.fillStyle(0x4488ff); gfx.fillRect(0, 0, 40, 40);
  gfx.generateTexture('player', 40, 40); gfx.destroy();
  this.player = this.physics.add.sprite(400, 300, 'player');

[R7] NO COMMENTS — ZERO comments (// or /* */ or <!-- -->). Comments break streaming.

[R8] NO DUPLICATE METHODS — preload, create, update each appear ONCE per class.

[R9] BRACE BALANCE — Every { has matching }.

[R10] NO CONST MUTATION — CRITICAL:
Variables that change value MUST use let, NEVER const.
Scan every variable before outputting:
- const declared then += or = assigned later → CHANGE TO let
- Most dangerous: loop variables, physics accumulators, counters
- const is ONLY for values that never change: canvas, ctx, config objects, fixed arrays
- When in doubt use let — const mutation is a silent crash

═══════════════════════════════════════════════
VISUAL QUALITY — NON-NEGOTIABLE:
═══════════════════════════════════════════════
[V1] Use fillGradientStyle for rich fills where available, or layer multiple shapes for depth.
[V2] Create multi-layer textures: base shape + border + highlight + shadow.
[V3] Use this.add.rectangle for UI panels with alpha < 1 for semi-transparency.
[V4] Title and GameOver scenes must have styled text with setShadow and gradient backgrounds.
[V5] Particle effects using this.add.particles(x, y, 'textureName', { speed:100, lifespan:500, quantity:5 }) — Phaser 3.60+ API.
[V6] Color palettes must be harmonious — derive from base hue with HSL shifts.

═══════════════════════════════════════════════
PHASER 3.90 API NOTES:
═══════════════════════════════════════════════
PARTICLES (3.60+ only — old createEmitter API removed):
  CORRECT: this.add.particles(x, y, 'texture', { speed: 100, lifespan: 500, quantity: 5 })
  WRONG: this.add.particles('texture').createEmitter({...}) — REMOVED

PHYSICS:
  this.physics.add.collider(player, platforms);
  this.physics.add.overlap(player, coins, collectCoin, null, this);
  sprite.setVelocityX(200); sprite.setBounce(0.8);

═══════════════════════════════════════════════
GAMEPLAY STANDARDS:
═══════════════════════════════════════════════
[P1] Velocities in reasonable px/s: 200-800. Not tiny values.
[P2] Paddle bounces reflect, not deduct lives.
[P3] NEVER destroy while iterating group. Use deferred destroy.
[P4] ALWAYS check if(obj && obj.active) before physics ops.
[P5] **IF NEEDED** ENTITY CLEANUP — correct filter pattern:
  bodies = bodies.filter(b => !b.destroyed);
  NEVER use compound conditions like (!b.destroyed || someOtherCondition)
  for cleanup — it creates ghost entities that accumulate silently.

[P6] **IF NEEDED** STATE MACHINE COMPLETENESS:
  Every state in the stateManagement plan MUST have a case in BOTH
  the update() switch AND the draw() switch.
  Missing cases cause silent freezes with no error.
  If a state has no logic, add an empty case:
  case 'WAITING': break;

═══════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════
Output ONLY raw HTML. Start EXACTLY with <!DOCTYPE html>, end EXACTLY with </html>.
NO markdown, NO backticks, NO conversational text.`;

function getCapabilityPatterns(capabilities: string[]): string {
  const patterns: Record<string, string> = {

    SCROLLING_WORLD: `
SCROLLING_WORLD — world moves left, player X stays fixed:
  let scrollSpeed = 300;
  let spawnTimer = 2;
  const obstacles = [];
  const coins = [];
  const PLAYER_X = canvas.width * 0.2;

  function updateWorld(dt) {
    scrollSpeed = Math.min(800, 300 + score * 0.4);
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 1.2 + Math.random() * 1.3;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= scrollSpeed * dt;
      if (obstacles[i].x < -150) obstacles.splice(i, 1);
    }
  }`,

    CAMERA_FOLLOW: `
CAMERA_FOLLOW — smooth camera tracks player through large world:
  let cameraX = 0;
  let cameraY = 0;

  function updateCamera() {
    cameraX += (player.x - canvas.width * 0.35 - cameraX) * 0.08;
    cameraY += (player.y - canvas.height * 0.5 - cameraY) * 0.08;
  }

  Draw world inside camera transform:
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  drawWorld();
  ctx.restore();
  drawHUD();`,

    PROCEDURAL_TERRAIN: `
PROCEDURAL_TERRAIN — generate terrain ahead, recycle behind:
  CRITICAL SAFETY RULES:
  - generateTerrain() MUST use a for loop with fixed iteration count, NEVER while loop
  - Always initialize terrain array with 30 points in init() before game loop starts
  - cameraX defaults to 0 if undefined — never let it be NaN or undefined

  let nextTerrainX = 0;
  let lastTerrainY = 300;
  const terrain = [];

  function initTerrain() {
    terrain.length = 0;
    nextTerrainX = 0;
    lastTerrainY = canvas.height * 0.65;
    for (let i = 0; i < 40; i++) {
      lastTerrainY += (Math.random()-0.5) * 50;
      lastTerrainY = Math.max(canvas.height*0.35, Math.min(canvas.height*0.82, lastTerrainY));
      terrain.push({ x: nextTerrainX, y: lastTerrainY });
      nextTerrainX += 80;
    }
  }

  function extendTerrain() {
    const safeCamera = isFinite(cameraX) ? cameraX : 0;
    const targetX = safeCamera + canvas.width + 400;
    let iterations = 0;
    while (terrain.length > 0 && terrain[terrain.length-1].x < targetX && iterations < 20) {
      iterations++;
      lastTerrainY += (Math.random()-0.5) * 50;
      lastTerrainY = Math.max(canvas.height*0.35, Math.min(canvas.height*0.82, lastTerrainY));
      terrain.push({ x: nextTerrainX, y: lastTerrainY });
      nextTerrainX += 80;
    }
    while (terrain.length > 3 && terrain[1].x < safeCamera - 400) terrain.shift();
  }

  function getTerrainY(x) {
    if (!terrain || terrain.length < 2) return canvas.height * 0.65;
    for (let i = 0; i < terrain.length-1; i++) {
      if (x >= terrain[i].x && x < terrain[i+1].x) {
        const t = (x-terrain[i].x)/(terrain[i+1].x-terrain[i].x);
        return terrain[i].y*(1-t) + terrain[i+1].y*t;
      }
    }
    return terrain[terrain.length-1].y;
  }

  Call initTerrain() inside init() before game loop.
  Call extendTerrain() once per frame inside updatePlaying().
  NEVER call generateTerrain with an unbounded while loop.`,

    LANE_SYSTEM: `
LANE_SYSTEM — discrete lanes with smooth transition:
  const LANE_COUNT = 3;
  const LANES = [canvas.height*0.25, canvas.height*0.5, canvas.height*0.75];
  let currentLane = 1;
  let playerY = LANES[1];
  let targetY = LANES[1];

  function switchLane(dir) {
    currentLane = Math.max(0, Math.min(LANE_COUNT-1, currentLane+dir));
    targetY = LANES[currentLane];
  }
  playerY += (targetY - playerY) * 0.18;`,

    SWIPE_GESTURE: `
SWIPE_GESTURE — detect swipe direction from touch:
  let swipeStart = null;

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    swipeStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!swipeStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStart.x;
    const dy = t.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) onSwipeRight();
      else if (dx < -30) onSwipeLeft();
    } else {
      if (dy < -30) onSwipeUp();
      else if (dy > 30) onSwipeDown();
    }
  }, { passive: false });`,

    PROJECTILE_PHYSICS: `
    
PROJECTILE_PHYSICS — gravity arc trajectory:
TRAJECTORY DRAWING CRITICAL RULE:
NEVER use const for variables that get mutated in loops.
The parametric formula below is the ONLY correct approach — never use += mutation:

function drawTrajectory(startX, startY, initVx, initVy) {
  if (!isFinite(startX) || !isFinite(initVx)) return;
  const G = 800;
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 25; i++) {
    const t = i * 0.07;
    const px = startX + initVx * t;
    const py = startY + initVy * t + 0.5 * G * t * t;
    if (py > startY + 400) break;
    started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    started = true;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
  SAFETY RULES — read before implementing:
  - Define launchProjectile, updateProjectiles, drawTrajectory as function declarations
  - NEVER call these before they are defined — use function declarations not const arrows
  - Initialize projectiles = [] in init() not at module level with lazy population
  - Guard all projectile updates: if(!p || !isFinite(p.x)) continue;

  const GRAVITY = 800;
  let projectiles = [];

  function launchProjectile(x, y, vx, vy) {
    if (!isFinite(x) || !isFinite(y) || !isFinite(vx) || !isFinite(vy)) return;
    projectiles.push({ x, y, vx, vy, r: 14, active: true, trail: [] });
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length-1; i >= 0; i--) {
      const p = projectiles[i];
      if (!p || !isFinite(p.x)) { projectiles.splice(i,1); continue; }
      p.trail.push({x: p.x, y: p.y});
      if (p.trail.length > 8) p.trail.shift();
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > canvas.height + 100) projectiles.splice(i, 1);
    }
  }

  function drawTrajectory(startX, startY, vx, vy) {
    if (!isFinite(startX) || !isFinite(vx)) return;
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let drawn = false;
    for (let t = 0; t < 2.0; t += 0.06) {
      const px = startX + vx*t;
      const py = startY + vy*t + 0.5*GRAVITY*t*t;
      if (py > canvas.height + 50) break;
      drawn ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
      drawn = true;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }`,

    POCKET_ABSORPTION: `
POCKET_ABSORPTION — distance-based removal, never use colliders:
  function checkPockets(balls, pockets, onPocketed) {
    for (let i = balls.length-1; i >= 0; i--) {
      for (let j = 0; j < pockets.length; j++) {
        const dx = balls[i].x - pockets[j].x;
        const dy = balls[i].y - pockets[j].y;
        if (Math.sqrt(dx*dx+dy*dy) < pockets[j].r + balls[i].r * 0.55) {
          onPocketed(balls[i], j);
          balls.splice(i, 1);
          break;
        }
      }
    }
  }
  Call checkPockets() every frame in update. NEVER add pockets to any collision array.`,

    ELASTIC_COLLISION: `
ELASTIC_COLLISION — momentum transfer between equal-mass balls:
  function resolveCollision(b1, b2) {
    const dx = b2.x-b1.x, dy = b2.y-b1.y;
    const d = Math.sqrt(dx*dx+dy*dy);
    if (d === 0 || d > b1.r+b2.r) return;
    const nx = dx/d, ny = dy/d;
    const dvn = (b1.vx-b2.vx)*nx + (b1.vy-b2.vy)*ny;
    if (dvn <= 0) return;
    b1.vx -= dvn*nx; b1.vy -= dvn*ny;
    b2.vx += dvn*nx; b2.vy += dvn*ny;
    const overlap = (b1.r+b2.r-d)/2;
    b1.x -= overlap*nx; b1.y -= overlap*ny;
    b2.x += overlap*nx; b2.y += overlap*ny;
  }`,

    WAYPOINT_AI: `
WAYPOINT_AI — entities follow path point by point:
  function updateWaypointEntity(entity, waypoints, speed, dt) {
    if (entity.waypointIndex >= waypoints.length) return;
    const target = waypoints[entity.waypointIndex];
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const d = Math.sqrt(dx*dx+dy*dy);
    if (d < 8) {
      entity.waypointIndex++;
      return;
    }
    entity.x += (dx/d) * speed * dt;
    entity.y += (dy/d) * speed * dt;
  }`,

    TILE_PLACEMENT: `
TILE_PLACEMENT — snap placement to grid:
  const GRID_SIZE = 64;
  function snapToGrid(x, y) {
    return {
      x: Math.floor(x/GRID_SIZE)*GRID_SIZE,
      y: Math.floor(y/GRID_SIZE)*GRID_SIZE
    };
  }
  function gridKey(x, y) { return x+','+y; }`,

    VEHICLE_PHYSICS: `
VEHICLE_PHYSICS — angle-based movement with grip:
  function updateVehicle(vehicle, input, dt) {
    if (input.left) vehicle.angle -= vehicle.turnSpeed * dt;
    if (input.right) vehicle.angle += vehicle.turnSpeed * dt;
    if (input.up) vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + vehicle.accel*dt);
    else vehicle.speed *= 0.97;
    vehicle.vx = Math.cos(vehicle.angle) * vehicle.speed;
    vehicle.vy = Math.sin(vehicle.angle) * vehicle.speed;
    vehicle.x += vehicle.vx * dt;
    vehicle.y += vehicle.vy * dt;
  }`,

    TURRET_ATTACK: `
TURRET_ATTACK — auto-attack nearest enemy in range:
  function updateTurret(turret, enemies, projectiles, dt) {
    turret.cooldown -= dt;
    if (turret.cooldown > 0) return;
    let nearest = null, nearestDist = turret.range;
    enemies.forEach(e => {
      const d = Math.hypot(e.x-turret.x, e.y-turret.y);
      if (d < nearestDist) { nearest = e; nearestDist = d; }
    });
    if (!nearest) return;
    turret.cooldown = turret.attackInterval;
    const angle = Math.atan2(nearest.y-turret.y, nearest.x-turret.x);
    projectiles.push({ x:turret.x, y:turret.y, vx:Math.cos(angle)*400, vy:Math.sin(angle)*400, damage:turret.damage, target:nearest });
  }`,

    DESTRUCTIBLE_TARGETS: `
DESTRUCTIBLE_TARGETS — HP based damage with visual states:
  function damageTarget(target, amount) {
    target.hp -= amount;
    target.shakeTimer = 0.15;
    spawnDebrisParticles(target.x, target.y, target.color);
    if (target.hp <= 0) target.destroyed = true;
  }

  function drawTarget(target) {
    const shake = target.shakeTimer > 0 ? (Math.random()-0.5)*4 : 0;
    target.shakeTimer = Math.max(0, (target.shakeTimer||0) - 0.016);
    const alpha = target.destroyed ? 0 : Math.max(0.3, target.hp/target.maxHp);
    ctx.globalAlpha = alpha;
    drawBlock(target.x+shake, target.y+shake, target.w, target.h, target.color);
    ctx.globalAlpha = 1;
  }`,

    DRAG_TO_AIM: `
DRAG_TO_AIM — drag from object to set angle and power:
  let dragStart = null;
  let dragCurrent = null;

  function onDown(x, y) { dragStart = {x, y}; dragCurrent = {x, y}; }
  function onMove(x, y) { if (dragStart) dragCurrent = {x, y}; }
  function onUp(x, y) {
    if (!dragStart) return;
    const dx = dragStart.x - x;
    const dy = dragStart.y - y;
    const power = Math.min(Math.sqrt(dx*dx+dy*dy) * 8, 1000);
    const angle = Math.atan2(dy, dx);
    launch(Math.cos(angle)*power, Math.sin(angle)*power);
    dragStart = null; dragCurrent = null;
  }`,

    PLATFORM_GRAVITY: `
PLATFORM_GRAVITY — gravity with ground/platform landing:
  const GRAVITY = 1200;

  function applyGravity(entity, dt) {
    entity.vy += GRAVITY * dt;
    entity.y += entity.vy * dt;
    entity.x += entity.vx * dt;
  }

  function landOnGround(entity, groundY) {
    if (entity.y + entity.h >= groundY) {
      entity.y = groundY - entity.h;
      entity.vy = 0;
      entity.grounded = true;
    } else {
      entity.grounded = false;
    }
  }`,

  };

  if (!capabilities || capabilities.length === 0) return '';

  const active = capabilities
    .filter(c => patterns[c])
    .map(c => patterns[c])
    .join('\n\n');

  return active.length > 0
    ? `\nCAPABILITY IMPLEMENTATIONS — use these EXACT patterns for the systems this game needs:\n${active}`
    : '';
}

function getCapabilityPatternsPhaser(capabilities: string[]): string {
  const patterns: Record<string, string> = {

    WAYPOINT_AI: `
WAYPOINT_AI (Phaser) — enemy follows waypoint path:
  updateWaypointEnemy(enemy, waypoints, speed) {
    if (enemy.waypointIndex >= waypoints.length) return;
    const target = waypoints[enemy.waypointIndex];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) { enemy.waypointIndex++; return; }
    enemy.setVelocity((dx/d)*speed, (dy/d)*speed);
  }`,

    TURRET_ATTACK: `
TURRET_ATTACK (Phaser) — find nearest enemy and shoot:
  updateTurret(turret, enemies, time) {
    if (time < turret.nextFire) return;
    let nearest = null, nearestDist = turret.range;
    enemies.getChildren().forEach(e => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(turret.x, turret.y, e.x, e.y);
      if (d < nearestDist) { nearest = e; nearestDist = d; }
    });
    if (!nearest) return;
    turret.nextFire = time + turret.fireRate;
    const angle = Phaser.Math.Angle.Between(turret.x, turret.y, nearest.x, nearest.y);
    const bullet = this.bullets.create(turret.x, turret.y, 'bullet');
    this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 400, bullet.body.velocity);
  }`,

    DESTRUCTIBLE_TARGETS: `
DESTRUCTIBLE_TARGETS (Phaser) — HP with damage state:
  damageObject(obj, amount) {
    obj.hp -= amount;
    this.tweens.add({ targets: obj, alpha: 0.3, duration: 80, yoyo: true });
    if (obj.hp <= 0) {
      this.spawnDebris(obj.x, obj.y);
      obj.destroy();
    }
  }`,

    PLATFORM_GRAVITY: `
PLATFORM_GRAVITY (Phaser) — use arcade gravity:
  In config: arcade: { gravity: { y: 800 } }
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);
  Jump: if (cursors.up.isDown && player.body.blocked.down) player.setVelocityY(-600);`,

    CAMERA_FOLLOW: `
CAMERA_FOLLOW (Phaser) — built-in camera follow:
  this.cameras.main.startFollow(player, true, 0.08, 0.08);
  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  HUD elements must use setScrollFactor(0) to stay fixed:
  scoreText.setScrollFactor(0);`,

    VEHICLE_PHYSICS: `
VEHICLE_PHYSICS (Phaser) — angle-based car movement:
  update(cursors) {
    const speed = 300;
    const turnSpeed = 3;
    if (cursors.left.isDown) this.car.rotation -= turnSpeed * 0.016;
    if (cursors.right.isDown) this.car.rotation += turnSpeed * 0.016;
    if (cursors.up.isDown) {
      this.physics.velocityFromRotation(this.car.rotation, speed, this.car.body.velocity);
    } else {
      this.car.body.velocity.scale(0.97);
    }
  }`,

  };

  if (!capabilities || capabilities.length === 0) return '';
  const active = capabilities.filter(c => patterns[c]).map(c => patterns[c]).join('\n\n');
  return active.length > 0
    ? `\nPHASER CAPABILITY IMPLEMENTATIONS — use these patterns:\n${active}`
    : '';
}

function inferCapabilitiesFromMechanics(mechanics: { name: string, description: string }[]): string[] {
  const caps: string[] = [];
  const text = mechanics.map(m => m.name + ' ' + m.description).join(' ').toLowerCase();
  if (text.includes('scroll') || text.includes('endless') || text.includes('infinite')) caps.push('SCROLLING_WORLD');
  if (text.includes('lane')) caps.push('LANE_SYSTEM');
  if (text.includes('swipe')) caps.push('SWIPE_GESTURE');
  if (text.includes('gravity') || text.includes('arc') || text.includes('trajectory')) caps.push('PROJECTILE_PHYSICS');
  if (text.includes('pocket') || text.includes('hole') || text.includes('drain')) caps.push('POCKET_ABSORPTION');
  if (text.includes('collision') && (text.includes('ball') || text.includes('carrom') || text.includes('pool'))) caps.push('ELASTIC_COLLISION');
  if (text.includes('waypoint') || text.includes('path') || text.includes('follow')) caps.push('WAYPOINT_AI');
  if (text.includes('place') || text.includes('grid') || text.includes('build')) caps.push('TILE_PLACEMENT');
  if (text.includes('steer') || text.includes('vehicle') || text.includes('car') || text.includes('racing')) caps.push('VEHICLE_PHYSICS');
  if (text.includes('tower') || text.includes('shoot') && text.includes('range')) caps.push('TURRET_ATTACK');
  if (text.includes('hp') || text.includes('health') || text.includes('destroy') || text.includes('break')) caps.push('DESTRUCTIBLE_TARGETS');
  if (text.includes('drag') && text.includes('aim')) caps.push('DRAG_TO_AIM');
  if (text.includes('camera') || text.includes('follow')) caps.push('CAMERA_FOLLOW');
  if (text.includes('terrain') || text.includes('procedural')) caps.push('PROCEDURAL_TERRAIN');
  if (text.includes('platform') || text.includes('jump') || text.includes('fall')) caps.push('PLATFORM_GRAVITY');
  return caps;
}

export class CoderAgent {

  private llm: LLM;
  private sessionId: string;

  constructor(llm: LLM, sessionId: string) {
    this.llm = llm;
    this.sessionId = sessionId;
  }

  async *build(plan: PlanResponse, previousCode?: string, rewritePrompt?: string): AsyncGenerator<string> {

    const systemPrompt = plan.framework === 'vanilla' ? SYSTEM_PROMPT_VANILLA : SYSTEM_PROMPT_PHASER;

    const mobileOverride = plan.platform === 'mobile' ? `
      CRITICAL MOBILE OVERRIDE — ALL RULES MANDATORY:

      [M1] FORBIDDEN — NEVER USE: keydown, keyup, keyboard.createCursorKeys(), mousemove, mousedown, mouseup, clientX without offset correction.

      [M2] TOUCH COORDINATE EXTRACTION — use this EXACT pattern every time:
        function getTouchPos(e) {
          const r = canvas.getBoundingClientRect();
          const t = e.touches[0] || e.changedTouches[0];
          return { x: (t.clientX - r.left) * (canvas.width / r.width), y: (t.clientY - r.top) * (canvas.height / r.height) };
        }
        canvas.addEventListener('touchstart', e => { e.preventDefault(); const p = getTouchPos(e); onDown(p.x, p.y); }, { passive: false });
        canvas.addEventListener('touchmove', e => { e.preventDefault(); const p = getTouchPos(e); onMove(p.x, p.y); }, { passive: false });
        canvas.addEventListener('touchend', e => { e.preventDefault(); const p = getTouchPos(e); onUp(p.x, p.y); }, { passive: false });

      [M3] DRAG GAMES (pool, fruit ninja, slingshot):
        Use onDown/onMove/onUp functions that handle both mouse AND touch.
        Mouse: canvas.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); onDown(e.clientX-r.left, e.clientY-r.top); });
        Touch: as above using getTouchPos.
        Both mouse and touch call the SAME onDown/onMove/onUp handlers.

      [M4] CANVAS SIZE — for mobile use:
        canvas.width = Math.min(window.innerWidth, 480);
        canvas.height = Math.min(window.innerHeight, 720);
        Or match Phaser scale: mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH

      [M5] HIT AREAS — all tappable elements minimum 48x48px. Increase button zones on mobile.

      [M6] VIEWPORT META — MUST include in <head>:
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      ` : '';

    const physicsOverride = plan.physics ? `
    PHYSICS CONFIGURATION (implement EXACTLY):
    - Type: ${plan.physics.type}
    - Gravity: ${plan.physics.gravity ?? 0}
    - Friction: ${plan.physics.friction ?? 0.98} (multiply velocity each frame)
    - Restitution: ${plan.physics.restitution ?? 0.9} (wall/collision bounce factor)
    - Damping: ${plan.physics.damping ?? 0.998}
    - Notes: ${plan.physics.customNotes ?? 'Standard arcade physics'}
    ` : '';

    const stateOverride = plan.stateManagement ? `
    STATE MACHINE (implement ALL states and transitions):
    States: ${plan.stateManagement.states.join(', ')}
    Transitions:
    ${plan.stateManagement.transitions.map(t => `  ${t.from} → ${t.to} on: ${t.trigger}`).join('\n')}
    ` : '';

    const finalSystemPrompt = systemPrompt + mobileOverride;

    const capabilitiesResolved = (plan.capabilities && plan.capabilities.length > 0)
      ? plan.capabilities
      : inferCapabilitiesFromMechanics(plan.mechanics);

    const gameSpecificRules = plan.framework === 'vanilla'
      ? getCapabilityPatterns(capabilitiesResolved)
      : getCapabilityPatternsPhaser(capabilitiesResolved);

    let prompt = `
            ${rewritePrompt && previousCode ? `
            ⚠️ REWRITE REQUEST — Your previous code FAILED review.

            BROKEN CODE SUMMARY (do NOT reproduce this — rewrite from scratch):
            Length: ${previousCode?.length} characters
            Framework used: ${plan.framework}
            Known issues from review:
            ${rewritePrompt}

            Write a completely fresh implementation. Do not copy from broken code.
            Only preserve what worked. Fix all listed issues from scratch.
            ---
            ` : ''}

            BUILD THIS GAME:
            TITLE: ${plan.title}
            DESCRIPTION: ${plan.description}
            FRAMEWORK: ${plan.framework}
            COMPLEXITY: ${plan.complexity}

            ${physicsOverride}

            ${stateOverride}

            VISUAL ASSETS — draw EXACTLY as described using gradients and multi-layer techniques:
            ${plan.assetDescriptions.map(a => `- ${a}`).join('\n')}

            UI ELEMENTS — implement ALL:
            ${(plan.uiElements || []).map(u => `- ${u}`).join('\n')}

            MECHANICS (implement ALL — this is the complete list):
            ${plan.mechanics.map((m, i) => `${i + 1}. ${m.name}: ${m.description}`).join('\n')}

            CONTROLS:
            ${plan.controls.map(c => `- ${c.input}: ${c.action}`).join('\n')}

            SYSTEMS: ${plan.systems.join(', ')}

            GAME LOOP (follow step-by-step):
            ${plan.gameLoopDescription}

            ${gameSpecificRules}

            CRITICAL REMINDERS:
                1. NO COMMENTS anywhere — zero // or /* */ — they break the streaming parser
                2. Backgrounds and main entities MUST use gradients — no flat solid fills
                3. MUST have title screen, gameplay, game-over screen
                4. MUST have particles on hit/collect/destroy events
                5. POCKET/HOLE games — checkPockets() distance method ONLY, never collider
                6. CHARACTER drawing — body circle FIRST, features ON TOP
                7. All velocities in pixels per second (300-1000 range), never tiny values like 5
                8. Mobile games — getTouchPos() with canvas getBoundingClientRect scaling
                9. Count all braces before outputting — every { must have matching }
                10. Output raw HTML only, start <!DOCTYPE html>, end </html>
                11. COMPLETENESS — output the ENTIRE game in one response. 
                    Do not stop early. The closing </html> tag MUST be the last line.
                    If you are running long, simplify visual polish but NEVER cut game logic.
                    A complete simple game beats an incomplete complex one.


            Output raw HTML only. Start with <!DOCTYPE html>, end with </html>.
            `;

    const generator = await this.llm.generate<BuildResponse>({
      prompt: prompt,
      system: finalSystemPrompt,
      json: false,
      stream: true,
      mode: 'BUILD',
      sessionId: this.sessionId,
      skipCache: !!previousCode
    }) as AsyncGenerator<string>

    for await (const chunk of generator) {
      yield chunk
    }

  }
}
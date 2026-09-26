"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, Maximize2, Minimize2, Monitor, Download, MessageSquare, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { useGameBuilder } from "@/context/GameBuilderContext";
import { cn } from "@/lib/utils";

// Injected into every game iframe — scales the canvas DOWN to fit the viewport
// using transform:scale so the game's internal pixel dimensions are never changed.
const CANVAS_SCALE_SCRIPT = `
<script>
  (function () {
    var lastW = 0, lastH = 0;

    function fitCanvas() {
      var canvases = document.querySelectorAll('canvas');
      canvases.forEach(function (c) {
        // Use the canvas's intrinsic (pixel) dimensions, not its CSS size
        var nw = c.width || c.offsetWidth;
        var nh = c.height || c.offsetHeight;
        if (!nw || !nh) return;

        var vw = window.innerWidth;
        var vh = window.innerHeight;

        // Only scale down — never scale up past 1
        var scale = Math.min(vw / nw, vh / nh, 1);

        // Don't thrash the DOM if nothing changed
        if (scale === lastW && vw === lastH) return;
        lastW = scale; lastH = vw;

        var offsetX = Math.round((vw - nw * scale) / 2);
        var offsetY = Math.round((vh - nh * scale) / 2);

        c.style.transformOrigin = '0 0';
        c.style.transform      = 'scale(' + scale + ')';
        c.style.position       = 'absolute';
        c.style.left           = offsetX + 'px';
        c.style.top            = offsetY + 'px';
        // Clear any CSS width/height that might distort the canvas
        c.style.width          = '';
        c.style.height         = '';
        document.body.style.overflow = 'hidden';
      });
    }

    // Run at several points to catch synchronous, async, and Phaser-deferred canvas creation
    [0, 100, 300, 600, 1200, 2500].forEach(function (t) {
      setTimeout(fitCanvas, t);
    });

    window.addEventListener('load',   fitCanvas);
    window.addEventListener('resize', fitCanvas);

    // Watch for canvas elements added dynamically (Phaser, etc.)
    new MutationObserver(function () {
      setTimeout(fitCanvas, 50);
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();
<\/script>
`;

export default function GamePreview() {
  const router = useRouter();
  const { code, plan, status, error, retry, resetGame } = useGameBuilder();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRetryAndRedirect = () => {
    retry();
    router.push("?tab=chat");
  };

  const handleResetAndRedirect = () => {
    resetGame();
    router.push("?tab=chat");
  };

  const handleDownloadZip = async () => {
    if (!code) return;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    if (code.files && code.files.length > 0) {
      code.files.forEach((file) => {
        zip.file(file.filename, file.content);
      });
    } else if (code.code) {
      zip.file("index.html", code.code);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const filename = plan?.title
      ? `${plan.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`
      : "game.zip";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildSrcdoc = useCallback(() => {
    if (!code) return null;

    // ── Single-file HTML path ──────────────────────────────────────────────
    if (code.code) {
      let html = code.code;

      // Add Phaser CDN if needed
      const isPhaser = html.toLowerCase().includes('phaser');
      if (isPhaser && !html.includes('cdn.jsdelivr.net/npm/phaser')) {
        const cdn = `<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"><\/script>\n`;
        html = html.replace('</head>', cdn + '</head>');
      }

      // Inject viewport meta + canvas scaling into single-file games too
      const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`;
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${viewportMeta}\n</head>`);
      }
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${CANVAS_SCALE_SCRIPT}\n</body>`);
      } else {
        html += `\n${CANVAS_SCALE_SCRIPT}`;
      }

      return html;
    }

    // ── Multi-file path ────────────────────────────────────────────────────
    const htmlFile = code?.files?.find((f) => f.filename.endsWith(".html"));
    const cssFile = code?.files?.find((f) => f.filename.endsWith(".css"));
    const jsFile = code?.files?.find((f) => f.filename.endsWith(".js"));

    if (!htmlFile) return null;

    let html = htmlFile.content;

    const isPhaser =
      plan?.framework === "phaser" ||
      jsFile?.content?.includes("Phaser") ||
      html.includes("phaser");

    // Strip local file references
    html = html.replace(/<link[^>]*href=["'](?!http)[^"']*\.css["'][^>]*\/?>/gi, "");
    html = html.replace(/<script[^>]*src=["'](?!http)[^"']*\.js["'][^>]*><\/script>/gi, "");

    const styleBlock = cssFile ? `<style>\n${cssFile.content}\n</style>` : "";
    const scriptBlock = jsFile ? `<script>\n${jsFile.content}\n<\/script>` : "";

    const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`;

    // ── Base styles ─────────────────────────────────────────────────────────
    // NOTE: Do NOT set width/height on canvas here — games set those via JS
    // and a CSS override causes distortion. Scaling is handled by CANVAS_SCALE_SCRIPT.
    const baseStyles = `
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #000;
        }
        /* Let the canvas position itself; transform-scaling is done via JS */
        canvas {
          display: block;
          image-rendering: pixelated;
        }
      </style>
    `;

    const phaserCdn = isPhaser
      ? `<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"><\/script>\n`
      : "";

    // Phaser-specific scale config (still useful for Phaser's internal scaler)
    const phaserMobileFix = isPhaser ? `
      <script>
        window.addEventListener('load', function () {
          setTimeout(function () {
            if (window.phaserGame && window.phaserGame.scale) {
              window.phaserGame.scale.scaleMode  = Phaser.Scale.FIT;
              window.phaserGame.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
              window.phaserGame.scale.refresh();
            }
          }, 150);
        });
        window.addEventListener('resize', function () {
          if (window.phaserGame && window.phaserGame.scale) {
            window.phaserGame.scale.refresh();
          }
        });
      <\/script>
    ` : "";

    // ── Inject into <head> ─────────────────────────────────────────────────
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${viewportMeta}\n${baseStyles}\n${styleBlock}\n${phaserCdn}</head>`);
    } else {
      html = `${viewportMeta}\n${baseStyles}\n${styleBlock}\n${phaserCdn}\n${html}`;
    }

    // ── Inject before </body> ──────────────────────────────────────────────
    // Order: game script → Phaser fix → universal canvas scaler
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${scriptBlock}\n${phaserMobileFix}\n${CANVAS_SCALE_SCRIPT}\n</body>`);
    } else {
      html = `${html}\n${scriptBlock}\n${phaserMobileFix}\n${CANVAS_SCALE_SCRIPT}`;
    }

    return html;
  }, [code, plan]);

  const handleRefresh = () => setPreviewKey((k) => k + 1);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!code) {
    if (status === "FAILED") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center px-4 py-3 border-b border-border shrink-0 bg-card/30">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-muted-foreground" />
              Preview
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-100 text-rose-600 border border-rose-200 shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-rose-900 mb-2">
                Preview Unavailable
              </h3>
              <p className="text-xs sm:text-sm text-rose-700/90 mb-6 leading-relaxed">
                {error || "An unexpected error occurred during game creation. You can retry the current step in Chat."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetAndRedirect}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all duration-200 active:scale-[0.98] shadow-sm"
                >
                  Start Over
                </button>
                <button
                  onClick={handleRetryAndRedirect}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200 active:scale-[0.98] shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry in Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const isBuilding = status === "BUILDING";
    const isPlanning = status === "PLANNING";
    const isReview = status === "REVIEW";
    const isRebuild = status === "REBUILD";
    const isClarifying = status === "CLARIFYING";
    const isProcessing = isBuilding || isPlanning || isReview || isRebuild || isClarifying;

    if (isProcessing) {
      const stateConfig = isPlanning
        ? { title: "Blueprint in Development...", desc: "The AI is architecting game mechanics and rules. The preview will mount once code generation finishes.", badge: "Planning game...", badgeColor: "bg-blue-500/15 text-blue-600 border-blue-500/30" }
        : isReview
        ? { title: "Inspecting Game Runtime...", desc: "The code reviewer is verifying game physics and loop integrity.", badge: "Reviewing code...", badgeColor: "bg-violet-500/15 text-violet-600 border-violet-500/30" }
        : isRebuild
        ? { title: "Applying Code Patches...", desc: "The AI is adjusting game code to resolve review feedback.", badge: "Fixing issues...", badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
        : isClarifying
        ? { title: "Awaiting Input...", desc: "Answer the clarification questions in Chat to begin generating the game.", badge: "Clarifying...", badgeColor: "bg-purple-500/15 text-purple-600 border-purple-500/30" }
        : { title: "Assembling Game Preview...", desc: "Generating game assets, canvas setup, and event listeners. The interactive game will launch automatically when complete.", badge: "Building game...", badgeColor: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" };

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-card/30">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-muted-foreground" />
                Preview
              </h2>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border animate-pulse transition-all",
                stateConfig.badgeColor
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {stateConfig.badge}
              </span>
            </div>

            <button
              onClick={() => router.push("?tab=chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 transition-all duration-200 shadow-sm group"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Back to Chat</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/80 shadow-md">
              <Loader2 className="w-9 h-9 text-indigo-500 animate-spin" />
              <div className="absolute -inset-1 rounded-3xl bg-indigo-500/10 blur-sm animate-pulse -z-10" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-2">
              {stateConfig.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
              {stateConfig.desc}
            </p>
            <button
              onClick={() => router.push("?tab=chat")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all duration-200 active:scale-[0.98] shadow-sm group"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>View Progress in Chat</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-3.5 border-t border-border/40 bg-card/20 shrink-0">
            <p className="text-xs text-indigo-500 font-medium animate-pulse">
              ● Generating game engine, preview will mount automatically upon completion...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-muted-foreground" />
            Preview
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
              bg-gradient-to-br from-primary/8 to-accent/5 border border-border">
              <Monitor className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1.5">
              No preview yet
            </h3>
            <p className="text-xs text-muted-foreground/60 max-w-xs">
              Build a game through the chat to see a live preview here
            </p>
          </div>
        </div>
      </div>
    );
  }

  const srcdoc = buildSrcdoc();

  return (
    <div ref={containerRef} className={cn("flex flex-col flex-1 w-full h-full", isFullscreen && "bg-black")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0 bg-card/30">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Preview
          {plan?.title && (
            <span className="text-xs text-muted-foreground font-normal ml-1">
              — {plan.title}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-indigo-500 bg-indigo-50/50 rounded-lg border border-indigo-100/50 mr-1 animate-fade-in">
            <Download className="w-3 h-3" />
            <span>Download for best experience</span>
          </div>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shadow-sm"
            title="Download game files"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground
              hover:text-foreground hover:bg-secondary transition-all duration-200"
            title="Restart game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>
          <button
            onClick={handleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground
              hover:text-foreground hover:bg-secondary transition-all duration-200"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Failure banner when code exists */}
      {status === "FAILED" && (
        <div className="mx-3 my-2 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm shrink-0 animate-fade-in z-20">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-semibold text-rose-900">
                Update Failed
              </p>
              <p className="text-[11px] text-rose-700/90 line-clamp-1">
                {error || "The latest update failed. The last working build is running below."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleResetAndRedirect}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all active:scale-[0.98]"
            >
              Start Over
            </button>
            <button
              onClick={handleRetryAndRedirect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry in Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview iframe */}
      <div className="flex-1 relative bg-black w-full h-full overflow-hidden">
        {srcdoc ? (
          <iframe
            ref={iframeRef}
            key={previewKey}
            srcDoc={srcdoc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Game Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              Could not generate preview — HTML file missing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
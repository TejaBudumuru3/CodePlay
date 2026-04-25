"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, RotateCcw, Maximize2, Minimize2, Monitor, Download } from "lucide-react";
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
  const { code, plan, status } = useGameBuilder();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
        {(status === "BUILDING" || status === "REVIEW" || status === "REBUILD") && (
          <p className="text-xs text-indigo-400 animate-pulse mt-2">
            Code is being generated, preview will appear when complete...
          </p>
        )}
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
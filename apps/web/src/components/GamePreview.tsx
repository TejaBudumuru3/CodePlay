"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, RotateCcw, Maximize2, Minimize2, Monitor } from "lucide-react";
import { useGameBuilder } from "@/context/GameBuilderContext";
import { cn } from "@/lib/utils";

export default function GamePreview() {
  const { code, plan, status } = useGameBuilder();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const buildSrcdoc = useCallback(() => {
    if (!code?.files) return null;

    const htmlFile = code.files.find((f) => f.filename.endsWith(".html"));
    const cssFile = code.files.find((f) => f.filename.endsWith(".css"));
    const jsFile = code.files.find((f) => f.filename.endsWith(".js"));

    if (!htmlFile) return null;

    let html = htmlFile.content;

    // Determine if it's a Phaser game
    const isPhaser = plan?.framework === "phaser" ||
      jsFile?.content?.includes("Phaser") ||
      html.includes("phaser");

    // Remove existing CSS/JS link/script tags that reference local files
    html = html.replace(/<link[^>]*href=["'](?!http)[^"']*\.css["'][^>]*\/?>/gi, "");
    html = html.replace(/<script[^>]*src=["'](?!http)[^"']*\.js["'][^>]*><\/script>/gi, "");

    // Build injected style block
    const styleBlock = cssFile
      ? `<style>\n${cssFile.content}\n</style>`
      : "";

    // Build injected script block
    const scriptBlock = jsFile
      ? `<script>\n${jsFile.content}\n</script>`
      : "";

    // Build Phaser CDN tag if needed
    const phaserCdn = isPhaser
      ? `<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>\n`
      : "";

    // Inject styles into <head>
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${styleBlock}\n${phaserCdn}</head>`);
    } else {
      html = `${styleBlock}\n${phaserCdn}\n${html}`;
    }

    // Inject scripts before </body>
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${scriptBlock}\n</body>`);
    } else {
      html = `${html}\n${scriptBlock}`;
    }

    return html;
  }, [code, plan]);

  const handleRefresh = () => {
    setPreviewKey((k) => k + 1);
  };

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

  // Empty state
  if (status !== "COMPLETED" || !code) {
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
    <div ref={containerRef} className={cn("flex flex-col h-full", isFullscreen && "bg-black")}>
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
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 relative bg-black">
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

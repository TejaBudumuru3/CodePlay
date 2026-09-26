"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Copy, Check, FileCode2, FileText, Palette, Sparkles, MessageSquare, ArrowRight, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { useGameBuilder } from "@/context/GameBuilderContext";
import { useCredits } from "@/context/CreditsContext";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

function formatModelDisplayName(rawModel?: string): string {
  if (!rawModel) return "GEMINI FLASH";
  let cleaned = rawModel.replace(/^(models\/|nvidia\/|google\/|qwen\/)/i, "");
  cleaned = cleaned.replace(/(:free|-instruct)$/i, "");
  cleaned = cleaned.replace(/[-_]+/g, " ");
  return cleaned.trim().toUpperCase();
}

export default function CodeViewer() {
  const router = useRouter();
  const { code, plan, status, streamingCode, error, retry, resetGame } = useGameBuilder();
  const { tier } = useCredits();
  const [activeTab, setActiveTab] = useState("index.html");
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  const handleRetryAndRedirect = () => {
    retry();
    router.push("?tab=chat");
  };

  const handleResetAndRedirect = () => {
    resetGame();
    router.push("?tab=chat");
  };


  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [activeTab, code]);

  useEffect(() => {
    if (streamingCode && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingCode]);


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


  const handleCopy = async () => {
    const file = code?.files?.find((f) => f.filename === activeTab);
    const content = code?.code ?? file?.content
    if (!content) return;

    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith(".html")) return "markup";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".js")) return "javascript";
    return "markup";
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".html")) return FileCode2;
    if (filename.endsWith(".css")) return Palette;
    if (filename.endsWith(".js")) return FileText;
    return FileCode2;
  };

  const getFileColor = (filename: string) => {
    if (filename.endsWith(".html")) return "text-orange-400";
    if (filename.endsWith(".css")) return "text-blue-400";
    if (filename.endsWith(".js")) return "text-yellow-400";
    return "text-muted-foreground";
  };

  const isMultipleFiles = !!(code?.files?.length);
  const singleFileCode = code?.code

  const activeFile = isMultipleFiles ? code.files?.find((f) => f.filename === activeTab) : null;

  // Empty state
  if (!streamingCode && !code) {
    if (status === "FAILED") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center px-4 py-3 border-b border-border/60 shrink-0 bg-card/30">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
              Code
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-100 text-rose-600 border border-rose-200 shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-rose-900 mb-2">
                Code Generation Failed
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
        ? { title: "Architecting Game Blueprint...", desc: "The AI planner is generating the core mechanics, game loop, and physics specifications.", badge: "Planning game...", badgeColor: "bg-blue-500/15 text-blue-600 border-blue-500/30" }
        : isReview
        ? { title: "AI Review in Progress...", desc: "The code reviewer is verifying the game architecture, event listeners, and logic.", badge: "Reviewing code...", badgeColor: "bg-violet-500/15 text-violet-600 border-violet-500/30" }
        : isRebuild
        ? { title: "Refining & Fixing Issues...", desc: "The AI is applying fixes based on automated reviewer recommendations.", badge: "Fixing issues...", badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
        : isClarifying
        ? { title: "Awaiting Requirements...", desc: "The AI is clarifying game design specifications in the Chat tab.", badge: "Clarifying...", badgeColor: "bg-purple-500/15 text-purple-600 border-purple-500/30" }
        : { title: "Generating Game Code...", desc: "The AI is crafting the HTML, CSS, and JavaScript. Code will stream here in real-time.", badge: "Generating code...", badgeColor: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" };

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
                Code
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

          {/* Bottom pulse bar */}
          <div className="flex flex-col items-center justify-center p-3.5 border-t border-border/40 bg-card/20 shrink-0">
            <p className="text-xs text-indigo-500 font-medium animate-pulse">
              ● AI pipeline is running in the background. Stream will begin momentarily...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-3 border-b border-border/60 shrink-0 bg-card/30">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
            Code
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
              bg-gradient-to-br from-primary/8 to-accent/5 border border-border">
              <FileCode2 className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1.5">
              No code yet
            </h3>
            <p className="text-xs text-muted-foreground/60 max-w-xs">
              Start a conversation to generate game code
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!code && streamingCode) {
    const isReview = status === "REVIEW";
    const isRebuild = status === "REBUILD";
    const isFailed = status === "FAILED";

    const badgeConfig = isReview
      ? { label: "Reviewing code...", color: "bg-violet-500/15 text-violet-600 border-violet-500/30" }
      : isRebuild
      ? { label: "Fixing issues...", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
      : isFailed
      ? { label: "Generation failed", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" }
      : { label: "Generating code...", color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" };

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
              Code
            </h2>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all",
              isFailed ? "animate-none" : "animate-pulse",
              badgeConfig.color
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {badgeConfig.label}
            </span>
          </div>

          {(isReview || isRebuild || isFailed || status === "BUILDING") && (
            <button
              onClick={() => router.push("?tab=chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 transition-all duration-200 shadow-sm group"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isFailed ? "View in Chat" : isReview ? "View Review in Chat" : isRebuild ? "View Fixes in Chat" : "Back to Chat"}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {isFailed && (
          <div className="mx-3 mt-3 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm shrink-0 animate-fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-xs font-semibold text-rose-900">
                  Build Interrupted
                </p>
                <p className="text-[11px] text-rose-700/90 line-clamp-2">
                  {error || "Generation stopped unexpectedly. Partial code generated before interruption is preserved below."}
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

        <div className="flex-1 overflow-auto p-2">
          <pre className="bg-slate-50 border border-slate-100/50 rounded-xl min-h-full text-[12px] text-slate-800 whitespace-pre-wrap break-all font-mono leading-relaxed p-4 shadow-inner">
            {streamingCode}
            <div ref={streamEndRef} />
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="border-b border-border/60 shrink-0 bg-card/30">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-0.5">
            {code?.files?.map((file) => {
              const Icon = getFileIcon(file.filename);
              const color = getFileColor(file.filename);
              return (
                <button
                  key={file.filename}
                  onClick={() => setActiveTab(file.filename)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                    activeTab === file.filename
                      ? `bg-primary/8 ${color} border border-primary/15`
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{file.filename}</span>
                  <span className="sm:hidden">{file.filename.split('.').pop()?.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground
                hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground
                hover:shadow-md hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download ZIP</span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Failure banner when code exists */}
      {status === "FAILED" && (
        <div className="mx-3 mt-3 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm shrink-0 animate-fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-semibold text-rose-900">
                Update Failed
              </p>
              <p className="text-[11px] text-rose-700/90 line-clamp-2">
                {error || "An error occurred during the latest update. Displaying previous working code below."}
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

      {/* Code display */}
      <div className="flex-1 overflow-auto p-2">
        {(activeFile || singleFileCode) && (
          <pre className="bg-slate-50 border border-slate-100/50 rounded-xl min-h-full shadow-inner p-4 text-[12px]">
            <code
              ref={codeRef}
              className={`language-${isMultipleFiles && activeFile ? getLanguage(activeFile?.filename) : 'markup'} !bg-transparent`}
            >
              {isMultipleFiles ? activeFile?.content : singleFileCode}
            </code>
          </pre>
        )}
      </div>

      {/* Footer info */}
      {plan && (
        <div className="px-4 py-2 border-t border-border/60 bg-card/30 shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[150px] sm:max-w-none">
                  {plan.title} — {plan.framework === "phaser" ? "Phaser 3" : "Vanilla JS"}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-500 border border-indigo-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  {formatModelDisplayName((code as any)?.model || (tier === "PRO" ? "gemini-2.5-pro" : "gemini-3.5-flash-lite"))}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-indigo-600/70">
                <Download className="w-3 h-3" />
                <span className="font-medium">Download source for best experience</span>
              </div>
            </div>
            <span className="shrink-0">{code?.files?.length} files</span>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Copy, Check, FileCode2, FileText, Palette } from "lucide-react";
import { useGameBuilder } from "@/context/GameBuilderContext";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

export default function CodeViewer() {
  const { code, plan, status, streamingCode } = useGameBuilder();
  const [activeTab, setActiveTab] = useState("index.html");
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);


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
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/30 shrink-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
            Code
            <span className="text-xs text-indigo-400 font-normal animate-pulse">● Generating...</span>
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <pre className="bg-slate-50 border border-slate-100/50 rounded-xl min-h-full text-[12px] text-slate-800 whitespace-pre-wrap break-all font-mono leading-relaxed p-4 shadow-inner">
            {streamingCode}
            <div ref={streamEndRef} />
          </pre>
        </div>
      </div>
    )
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
            <span className="truncate mr-2">
              {plan.title} — {plan.framework === "phaser" ? "Phaser 3" : "Vanilla JS"}
            </span>
            <span className="shrink-0">{code?.files?.length} files</span>
          </div>
        </div>
      )}
    </div>
  );
}

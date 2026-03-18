"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, History } from "lucide-react";
import { useGameBuilder, type ChatMessage } from "@/context/GameBuilderContext";
import ProgressIndicator from "./ProgressIndicator";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ChatInterface({
  onToggleHistory,
  isHistoryExpanded
}: {
  onToggleHistory?: () => void;
  isHistoryExpanded?: boolean;
}) {
  const {
    status,
    messages,
    isLoading,
    startNewGame,
    answerClarification,
    resetGame,
  } = useGameBuilder();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (status === "CLARIFYING" && !isLoading) {
      inputRef.current?.focus();
    }
  }, [status, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");

    if (status === "IDLE") {
      await startNewGame(trimmed);
    } else if (status === "CLARIFYING") {
      await answerClarification(trimmed);
    }
  };

  const canSendMessage = status === "IDLE" || status === "CLARIFYING";

  const getPlaceholder = () => {
    if (isLoading) return "Analyzing data, please wait...";
    if (status === "IDLE") return "Ask me anything...";
    if (status === "CLARIFYING") return "Answer the questions above...";
    if (status === "COMPLETED") return "Game complete! Start a new game.";
    return "Waiting...";
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const animDelay = Math.min(index * 0.05, 0.3);

    switch (msg.role) {
      case "user":
        return (
          <div
            key={msg.id}
            className="flex items-start gap-3 justify-end animate-slide-up w-full"
            style={{ animationDelay: `${animDelay}s` }}
          >
            <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/10 text-white rounded-[24px] rounded-tr-[8px] px-6 py-3.5">
              <p className="text-[14px] whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        );

      case "agent":
        return (
          <div
            key={msg.id}
            className="flex items-start gap-3 animate-slide-up"
            style={{ animationDelay: `${animDelay}s` }}
          >
            {/* Agent Avatar (Glassy orb style) */}
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0
              bg-gradient-to-br from-indigo-400 via-blue-400 to-sky-400 shadow-lg shadow-indigo-500/20 p-[2px]">
              <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.2)]">
                <div className="w-full h-1/2 absolute top-0 rounded-t-full bg-gradient-to-b from-white/60 to-transparent"></div>
              </div>
            </div>
            <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] bg-white/80 backdrop-blur-xl shadow-sm border border-white/60 rounded-[24px] rounded-tl-[8px] px-6 py-4">
              <p className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        );

      case "status":
        return (
          <div key={msg.id} className="flex items-center gap-2 justify-center py-2 animate-slide-up"
            style={{ animationDelay: `${animDelay}s` }}>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[13px] text-slate-500 font-medium">{msg.content}</span>
          </div>
        );

      case "system":
        return (
          <div key={msg.id} className="flex items-center gap-2 justify-center py-2 animate-slide-up"
            style={{ animationDelay: `${animDelay}s` }}>
            <span className="text-[13px] text-red-500 bg-red-50 px-3 py-1 rounded-full font-medium">{msg.content}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full m-0 relative overflow-hidden bg-transparent w-full">
      {/* Absolute Floating Header Buttons */}
      <div className="px-8 py-6 shrink-0 z-20 flex justify-between items-center absolute top-0 w-full pointer-events-none">
        <div className="w-11 h-11 pointer-events-none"></div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          onClick={onToggleHistory}
          className={cn(
            "w-11 h-11 rounded-[14px] bg-white/80 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300 pointer-events-auto hover:scale-105",
            isHistoryExpanded && "bg-white ring-2 ring-primary/20"
          )}
          title="Toggle History"
        >
          <History className="w-[18px] h-[18px]" />
        </motion.button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 w-full z-10 scroll-smooth pt-24 pb-48 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8 flex flex-col">
          {messages.length === 0 && status === "IDLE" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center justify-center h-full text-center px-4 animate-slide-up py-12">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6
              bg-gradient-to-br from-indigo-200 via-blue-200 to-sky-100 shadow-xl border-4 border-white">
                <Sparkles className="w-10 h-10 text-white drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-3 tracking-tight">
                Hello! 👋 I'm your AI assistant.
              </h3>
              <p className="text-[15px] text-slate-500 max-w-sm leading-relaxed">
                Describe the game you want to build and I'll handle the coding, architecture, and setup for you.
              </p>
              <div className="flex flex-wrap gap-2 mt-8 justify-center">
                {[
                  "Snake game",
                  "Space shooter",
                  "Platformer",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-[13px] font-medium px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600
                    hover:text-primary hover:border-primary hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => renderMessage(msg, i))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="w-full">
              <ProgressIndicator status={status} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Area - Exactly matching reference pill style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="absolute bottom-16 sm:bottom-10 left-0 right-0 px-4 sm:px-12 lg:px-32 z-20 flex justify-center">
        <form onSubmit={handleSubmit} className="relative w-full max-w-3xl group">
          {/* Animated Gradient Layer beneath input */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-200 via-blue-300 to-sky-200 rounded-[32px] blur-md opacity-30 group-hover:opacity-50 transition duration-500"></div>

          {/* Inner Input Container */}
          <div className="relative bg-white/95 backdrop-blur-3xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/70 p-2 flex flex-col justify-between min-h-[110px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={!canSendMessage || isLoading}
              className={cn(
                "w-full bg-transparent px-5 py-3 text-[15px]",
                "text-slate-800 placeholder:text-slate-400 font-medium",
                "focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />

            {/* Toolbar below input - ONLY SEND button as requested */}
            <div className="flex flex-wrap items-center justify-end px-3 pb-2 gap-2">
              <button
                type="submit"
                disabled={!input.trim() || !canSendMessage || isLoading}
                className={cn(
                  "flex items-center gap-2 px-6 p-2.5 rounded-full text-[13px] font-bold transition-all duration-300",
                  "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(99,102,241,0.3)]",
                  "hover:shadow-[0_8px_20px_rgba(99,102,241,0.4)] hover:scale-[1.03] active:scale-[0.98]",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                )}
              >
                <Send className="w-[14px] h-[14px]" />
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import {
  Plus,
  Gamepad2,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  useGameBuilder,
  type SessionSummary,
} from "@/context/GameBuilderContext";
import { cn } from "@/lib/utils";

interface SessionHistoryProps {
  isOpen: boolean;
  onClose?: () => void;
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
  BUILDING: Loader2,
  PLANNING: Loader2,
  CLARIFYING: Clock,
  INIT: Clock,
};

const statusColors: Record<string, string> = {
  COMPLETED: "text-success",
  FAILED: "text-destructive",
  BUILDING: "text-amber-400",
  PLANNING: "text-amber-400",
  CLARIFYING: "text-blue-400",
  INIT: "text-muted-foreground",
};

export default function SessionHistory({ isOpen, onClose }: SessionHistoryProps) {
  const { sessions, loadSessions, loadSession, resetGame, sessionId } =
    useGameBuilder();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const getSessionTitle = (session: SessionSummary) => {
    if (session.plan?.title) return session.plan.title;
    return session.prompt.length > 40
      ? session.prompt.slice(0, 40) + "..."
      : session.prompt;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="w-full flex flex-col h-full shrink-0 bg-transparent">
      {/* Header */}
      <div className="px-5 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Session History</h2>
             {onClose && (
               <button 
                 onClick={onClose}
                 className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
               >
                 <XCircle className="w-4 h-4" />
               </button>
             )}
          </div>
          <button
            onClick={() => {
              resetGame();
              onClose?.();
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-all duration-200
              px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Gamepad2 className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground/60">No games yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {sessions.map((session) => {
              const StatusIcon = statusIcons[session.status] || Clock;
              const statusColor =
                statusColors[session.status] || "text-muted-foreground";
              const isActive = session.id === sessionId;

              return (
                <button
                  key={session.id}
                  onClick={() => {
                    loadSession(session.id);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary/8 border border-primary/15"
                      : "hover:bg-secondary/60 border border-transparent hover:border-border/40"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <StatusIcon
                      className={cn(
                        "w-4 h-4 shrink-0 mt-0.5",
                        statusColor,
                        ["BUILDING", "PLANNING"].includes(session.status) &&
                        "animate-spin"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/90"
                        )}
                      >
                        {getSessionTitle(session)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

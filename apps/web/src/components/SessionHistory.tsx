"use client";

import { useEffect } from "react";
import {
  Plus,
  Gamepad2,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Sparkles,
  Star,
  ArrowRight,
  Play
} from "lucide-react";
import {
  useGameBuilder,
  type SessionSummary,
} from "@/context/GameBuilderContext";
import { cn } from "@/lib/utils";
import { useCredits } from "@/context/CreditsContext";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

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
  COMPLETED: "text-emerald-500",
  FAILED: "text-rose-500",
  BUILDING: "text-amber-400",
  PLANNING: "text-amber-400",
  CLARIFYING: "text-indigo-400",
  INIT: "text-slate-400",
};

// Hardcoded showcase sessions (these should exist in your DB as public/showcase sessions)
// Replace these IDs with real completed session IDs from your database
const SHOWCASE_SESSIONS: any[] = [
  {
    id: 'cmlulikeg00000tpp7achwhwm',
    prompt: 'A polished space shooter with powerups and boss fights',
    status: 'COMPLETED',
    plan: { title: 'Galactic Vanguard' },
    createdAt: new Date().toISOString()
  },
  {
    id: 'showcase-2',
    prompt: 'Physics-based puzzle game with falling blocks',
    status: 'COMPLETED',
    plan: { title: 'Block Cascade' },
    createdAt: new Date().toISOString()
  }
];

export default function SessionHistory({ isOpen, onClose }: SessionHistoryProps) {
  const { sessions, loadSessions, loadSession, resetGame, sessionId } =
    useGameBuilder();
  const { isGuest } = useCredits();
  const router = useRouter();

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
    <div className="w-full flex flex-col h-[90%] shrink-0 bg-transparent">
      {/* Header */}
      <div className="px-5 py-5 shrink-0 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">
              {isGuest ? "Showcase Gallery" : "Session History"}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          {!isGuest && (
            <button
              onClick={() => {
                resetGame();
                onClose?.();
              }}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-all duration-200
                px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100/80"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isGuest && (
          <div className="px-3 mb-6">
            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 mb-4">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Featured Showcases
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Explore these complex games built by our Pro agents. View code, architecture, and play instantly.
              </p>
            </div>

            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    loadSession(session.id);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-2xl transition-all duration-300 group border-2 border-transparent",
                    sessionId === session.id
                      ? "bg-white border-indigo-200 shadow-lg shadow-indigo-500/5"
                      : "hover:bg-white hover:border-slate-100 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                      <Star className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{session?.plan?.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{session.prompt}</p>
                    </div>
                    <Play className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isGuest && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center mt-20">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <Gamepad2 className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-800">No games yet</p>
            <p className="text-xs text-slate-400 mt-1">Start your first build to see it here.</p>
          </div>
        ) : !isGuest && (
          <div className="px-2 space-y-0.5">
            {sessions.map((session) => {
              const StatusIcon = statusIcons[session.status] || Clock;
              const statusColor =
                statusColors[session.status] || "text-slate-400";
              const isActive = session.id === sessionId;

              return (
                <button
                  key={session.id}
                  onClick={() => {
                    loadSession(session.id);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group border",
                    isActive
                      ? "bg-white border-indigo-100 shadow-sm"
                      : "hover:bg-white/60 border-transparent hover:border-slate-100"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      statusColor.replace('text-', 'bg-'),
                      ["BUILDING", "PLANNING"].includes(session.status) && "animate-pulse"
                    )} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-bold truncate",
                          isActive ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                        )}
                      >
                        {getSessionTitle(session)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", statusColor)}>
                          {session.status}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[9px] text-slate-400 font-medium">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isGuest && (
        <div className="mt-auto p-5 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all"
          >
            Sign in to Build Your Own <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

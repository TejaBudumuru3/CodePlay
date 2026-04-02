"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameBuilderProvider, useGameBuilder } from "@/context/GameBuilderContext";
import { CreditsProvider, useCredits } from "@/context/CreditsContext";
import { MessageSquare, Code2, Play, PanelRightClose, PanelRightOpen, Coins } from "lucide-react";
import SessionHistory from "@/components/SessionHistory";
import ChatInterface from "@/components/ChatInterface";
import CodeViewer from "@/components/CodeViewer";
import GamePreview from "@/components/GamePreview";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

type MobileTab = "chat" | "code" | "preview";

import { LogOut, User as UserIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

function BuilderLayoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { status, streamingCode, sessionId } = useGameBuilder();
  
  const activeTab = (searchParams.get("tab") as MobileTab) || "chat";
  
  const [hasAutoSwitched, setHasAutoSwitched] = useState<Record<string, boolean>>({});
  const [userOverride, setUserOverride] = useState(false);
  const prevSessionIdRef = useRef<string | null>(null);
  
  const setActiveTab = useCallback((tab: MobileTab, isUserAction = false) => {
    if (isUserAction) {
      setUserOverride(true);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const { credits, maxCredits, isGuest, isLoading } = useCredits();

  useEffect(() => {
    if (sessionId !== prevSessionIdRef.current) {
      setHasAutoSwitched({});
      setUserOverride(false);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (userOverride) return;

    if (status === "BUILDING" && streamingCode.length > 0) {
      if (!hasAutoSwitched["BUILDING"] && activeTab !== "code") {
        setHasAutoSwitched(prev => ({ ...prev, BUILDING: true }));
        setActiveTab("code");
      }
    } else if (status === "COMPLETED") {
      if (!hasAutoSwitched["COMPLETED"] && activeTab !== "preview") {
        setHasAutoSwitched(prev => ({ ...prev, COMPLETED: true }));
        setActiveTab("preview");
      }
    }
  }, [status, streamingCode, activeTab, userOverride, hasAutoSwitched, setActiveTab]);

  const tabs: { id: MobileTab; label: string; icon: typeof MessageSquare }[] = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "code", label: "Code", icon: Code2 },
    { id: "preview", label: "Preview", icon: Play },
  ];

  return (
    <div className="h-screen w-full flex overflow-hidden relative bg-[#fff5fa] font-sans">
      {/* Global Gradient Background covering the ENTIRE page */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_30%,rgba(255,240,245,0.8),transparent_50%),radial-gradient(circle_at_100%_80%,rgba(240,248,255,0.8),transparent_40%),radial-gradient(circle_at_50%_50%,rgba(255,245,238,0.5),transparent_60%)] pointer-events-none z-0"></div>

      {/* ═══ Left Floating Sidebar (Desktop) ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="hidden md:flex flex-col items-center w-[72px] bg-white/70 backdrop-blur-3xl border border-white/60 m-4 rounded-[24px] py-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] z-50 shrink-0">
        {/* Logo at top */}
        <Link href="/" className="w-11 h-11 rounded-lg bg-white shadow-inner flex items-center justify-center mb-8 shrink-0">
          <span className="font-bold text-lg tracking-tighter"><Image src="/logo.png" alt="Logo" width={80} height={80} /></span>
        </Link>

        {/* Navigation Tabs Center */}
        <div className="flex flex-col gap-4 flex-1 w-full items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id, true)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                  isActive ? "bg-gradient-to-br from-indigo-100 to-blue-100 shadow-[0_4px_12px_rgba(99,102,241,0.15)]" : "hover:bg-slate-50 text-slate-400"
                )}
                title={tab.label}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600")} />
              </button>
            );
          })}
        </div>

        {/* Bottom User Actions */}
        <div className="flex flex-col gap-4 items-center shrink-0 w-full mt-auto relative">
          {showCredits && (
            <div className="absolute bottom-full left-14 mb-2 p-3 bg-white shadow-xl border border-slate-200 rounded-xl w-48 z-50 animate-fade-in text-center flex flex-col items-center">
              <Coins className="w-6 h-6 text-amber-500 mb-1" />
              <h4 className="font-bold text-slate-800 text-sm">{isGuest ? "Guest Credits" : "Daily Credits"}</h4>
              <p className="text-2xl font-black text-indigo-600 my-1">{isLoading ? "..." : credits} <span className="text-sm text-slate-400 font-medium">/ {maxCredits}</span></p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Refreshes at midnight</p>
            </div>
          )}

          <div 
            onClick={() => setShowCredits(!showCredits)}
            className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors overflow-hidden">
            {session?.user?.image ? (
              <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-slate-500" />
            )}
          </div>

          {session?.user && (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" title="Log out">
              <LogOut className="w-[18px] h-[18px] ml-1" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        {/* Main tabs view - switching between Chat, Code, Preview */}
        <div className="flex-1 w-full h-full relative">
          {activeTab === "chat" && (
            <ChatInterface
              onToggleHistory={() => setShowHistoryPanel(!showHistoryPanel)}
              isHistoryExpanded={showHistoryPanel}
            />
          )}

          {activeTab === "code" && (
            <div className="w-full h-full animate-fade-in flex flex-col p-4 pb-24 md:p-4 md:pb-4">
              <div className="flex-1 w-full flex flex-col bg-white/80 backdrop-blur-3xl rounded-[24px] border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.05)] overflow-hidden">
                <CodeViewer />
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="w-full h-full animate-fade-in flex flex-col p-2 pb-24 sm:p-4 sm:pb-24 md:p-4 md:pb-4">
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0, duration: 0.5 }}
                className="flex-1 w-full flex flex-col bg-white/80 backdrop-blur-3xl rounded-[20px] sm:rounded-[24px] border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.05)] overflow-hidden">
                <GamePreview />
              </motion.div>
            </div>
          )}
        </div>

        {/* Right Floating History Panel */}
        <div className={cn(
          "absolute right-4 top-4 bottom-4 z-50 transition-all duration-500 ease-in-out bg-white/80 backdrop-blur-3xl rounded-[24px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col pointer-events-auto",
          showHistoryPanel ? "translate-x-0 opacity-100 w-[300px] xl:w-[320px]" : "translate-x-[120%] opacity-0 w-[300px] xl:w-[320px] pointer-events-none"
        )}>
          <SessionHistory isOpen={true} onClose={() => setShowHistoryPanel(false)} />
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 border-t border-white/60 bg-white/80 shrink-0 backdrop-blur-xl pb-safe z-50">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id, true)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all duration-200",
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", activeTab === id && "drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]")} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}


export default function BuilderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreditsProvider>
        <GameBuilderProvider>
          <BuilderLayoutContent />
        </GameBuilderProvider>
      </CreditsProvider>
    </Suspense>
  );
}

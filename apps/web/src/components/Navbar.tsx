"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Gamepad2, LogOut, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-border/60 glass-strong flex items-center justify-between px-4 shrink-0 relative">
      {/* Subtle gradient accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 hover:bg-secondary/80 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-400 to-blue-600 text-white shadow-md shadow-indigo-500/20">
            <span className="font-bold text-sm tracking-tighter"><Image src="/logo.png" alt="Logo" width={24} height={24} /></span>
          </div>
          <span className="font-bold tracking-tight text-slate-800 hidden sm:block">CodePlay</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {session?.user && (
          <>
            <div className="flex items-center gap-2.5">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-7 h-7 rounded-full ring-2 ring-primary/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                  bg-gradient-to-br from-primary/20 to-accent/10 text-primary border border-primary/20">
                  {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {session.user.name || session.user.email}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 hover:bg-secondary/80 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

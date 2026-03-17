"use client";

import { signIn } from "next-auth/react";
import { Gamepad2, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

const errorMessages: Record<string, string> = {
  Configuration: "Server configuration error. Check that DATABASE_URL and NEXTAUTH_SECRET are set in .env.local.",
  AccessDenied: "Access denied.",
  Verification: "Verification link expired. Please try again.",
  CredentialsSignin: "Could not sign in. Check server logs.",
  Default: "An error occurred during sign in. Please try again.",
};

function LoginContent() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? (errorMessages[errorCode] ?? errorMessages.Default)
    : null;

  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    await signIn("google", { callbackUrl: "/builder" });
  };

  const handleGuestSignIn = async () => {
    setIsLoading("guest");
    await signIn("guest", { callbackUrl: "/builder" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/4 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="glass-strong rounded-3xl p-8 sm:p-10 shadow-2xl shadow-primary/5 gradient-border">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center mb-5
              bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 animate-glow-pulse"
              style={{ width: '4.5rem', height: '4.5rem' }}>
              <Image src="/logo.png" alt="Logo" width={80} height={80} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              CodePlay
            </h1>
            <p className="text-muted-foreground text-sm mt-2.5 text-center max-w-xs leading-relaxed">
              Describe your game idea and let AI agents build it for you
            </p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Sign in buttons */}
          <div className="space-y-3.5">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white text-gray-800 rounded-xl font-medium
                hover:bg-gray-50 transition-all duration-300
                hover:shadow-lg hover:shadow-white/10 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading === "google" ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign in with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center mx-2 text-xs">
                <span className="text-muted-foreground px-2 bg-white">or</span>
              </div>
            </div>

            <button
              onClick={handleGuestSignIn}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all duration-300
                bg-secondary/60 text-secondary-foreground border border-border
                hover:bg-secondary hover:border-primary/20 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading === "guest" ? (
                <div className="w-5 h-5 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
              ) : null}
              Continue as Guest
            </button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground/70 text-center mt-7">
            Guest mode saves only your latest game. Sign in to keep history.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

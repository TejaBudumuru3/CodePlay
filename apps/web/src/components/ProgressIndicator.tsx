"use client";

import { Loader2, Sparkles, Wrench, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/context/GameBuilderContext";

interface ProgressIndicatorProps {
  status: SessionStatus;
}

const statusConfig: Record<
  string,
  { icon: typeof Loader2; label: string; sublabel: string; color: string; bgFrom: string; bgTo: string }
> = {
  INIT: {
    icon: Brain,
    label: "Analyzing",
    sublabel: "Understanding your game idea...",
    color: "text-blue-400",
    bgFrom: "from-blue-500/15",
    bgTo: "to-blue-400/5",
  },
  CLARIFYING: {
    icon: Brain,
    label: "Clarifying",
    sublabel: "Agent is reviewing your answers...",
    color: "text-blue-400",
    bgFrom: "from-blue-500/15",
    bgTo: "to-blue-400/5",
  },
  PLANNING: {
    icon: Sparkles,
    label: "Planning",
    sublabel: "Designing game architecture & mechanics...",
    color: "text-amber-400",
    bgFrom: "from-amber-500/15",
    bgTo: "to-amber-400/5",
  },
  BUILDING: {
    icon: Wrench,
    label: "Building",
    sublabel: "Generating HTML, CSS & JavaScript code...",
    color: "text-emerald-400",
    bgFrom: "from-emerald-500/15",
    bgTo: "to-emerald-400/5",
  },
};

export default function ProgressIndicator({ status }: ProgressIndicatorProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;
  const stepOrder = ["INIT", "CLARIFYING", "PLANNING", "BUILDING", "COMPLETED"];
  const currentIdx = stepOrder.indexOf(status);

  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-slide-up">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
          `bg-gradient-to-br ${config.bgFrom} ${config.bgTo} border border-primary/15`
        )}
      >
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>
            {config.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground animate-pulse-glow">
          {config.sublabel}
        </p>
        {/* Gradient progress bar */}
        <div className="flex gap-1.5 mt-3">
          {["INIT", "PLANNING", "BUILDING", "COMPLETED"].map((step, i) => {
            const stepIdx = stepOrder.indexOf(step);
            const isActive = stepIdx <= currentIdx;
            const isCurrent = step === status || (step === "INIT" && status === "CLARIFYING");
            return (
              <div
                key={step}
                className={cn(
                  "h-1 rounded-full transition-all duration-700",
                  i === 0 ? "w-8" : "w-14",
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent"
                    : "bg-border/50",
                  isCurrent && "animate-pulse-glow"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
  outline: "border-white/15 text-slate-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.08em]",
        variantClasses[variant],
        className,
      )}
      {...rest}
    />
  );
}

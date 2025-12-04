import { cn } from "@/lib/cn";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({ className, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg backdrop-blur",
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn("text-lg font-semibold text-slate-50", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn("text-sm text-slate-400", className)} {...rest} />;
}

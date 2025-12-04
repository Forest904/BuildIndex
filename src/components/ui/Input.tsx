import { cn } from "@/lib/cn";
import { forwardRef, InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

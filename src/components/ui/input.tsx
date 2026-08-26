import type { InputHTMLAttributes } from "react";

import { cn } from "@/src/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface-subtle px-3.5 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted/70 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

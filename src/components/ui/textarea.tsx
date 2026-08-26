import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/src/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-line bg-surface px-3.5 py-3 text-sm leading-6 text-ink outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

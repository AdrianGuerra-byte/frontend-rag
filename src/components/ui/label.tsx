import type { LabelHTMLAttributes } from "react";

import { cn } from "@/src/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[13px] font-semibold text-ink", className)}
      {...props}
    />
  );
}

import { cn } from "@/src/lib/utils";

interface ProductMarkProps {
  className?: string;
}

export function ProductMark({ className }: ProductMarkProps) {
  return (
    <span aria-hidden="true" className={cn("relative size-9 shrink-0 text-primary", className)}>
      <span className="absolute left-0 top-0 size-3 border-l border-t border-current" />
      <span className="absolute right-0 top-0 size-3 border-r border-t border-current" />
      <span className="absolute bottom-0 left-0 size-3 border-b border-l border-current" />
      <span className="absolute bottom-0 right-0 size-3 border-b border-r border-current" />
      <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
    </span>
  );
}

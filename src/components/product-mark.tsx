import Image from "next/image";

import { cn } from "@/src/lib/utils";

interface ProductMarkProps {
  className?: string;
}

export function ProductMark({ className }: ProductMarkProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={cn("size-12 shrink-0 object-contain", className)}
      height={951}
      sizes="48px"
      src="/radia-logo.png"
      width={955}
    />
  );
}

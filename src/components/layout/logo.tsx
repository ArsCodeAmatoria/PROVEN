import Link from "next/link";
import { FingerprintPattern } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <FingerprintPattern className="h-7 w-7 shrink-0" aria-hidden strokeWidth={1.75} />
      <span className="text-[15px]">Proven</span>
    </Link>
  );
}

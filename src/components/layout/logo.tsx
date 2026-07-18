import Link from "next/link";

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
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
        P
      </span>
      <span className="text-[15px]">Proven</span>
    </Link>
  );
}

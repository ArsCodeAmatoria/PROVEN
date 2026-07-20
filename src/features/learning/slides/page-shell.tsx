import { cn } from "@/lib/utils";

/** Mobile-fit width; expands on desktop for readable line length. */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[min(100%,28rem)] px-5 sm:max-w-2xl lg:max-w-4xl lg:px-10 xl:max-w-5xl",
        className
      )}
    >
      {children}
    </div>
  );
}

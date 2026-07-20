import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface DataTableColumn {
  key: string;
  header: string;
  className?: string;
}

interface DataTableShellProps {
  columns: DataTableColumn[];
  children: React.ReactNode;
  empty?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DataTableShell({
  columns,
  children,
  empty = false,
  emptyIcon,
  emptyTitle = "No results",
  emptyDescription = "Nothing matches the current filters.",
  toolbar,
  footer,
  className,
}: DataTableShellProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {toolbar}
      {empty ? (
        emptyIcon ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{emptyTitle}</p>
            <p className="mt-1">{emptyDescription}</p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground",
                        column.className,
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {children}
              </tbody>
            </table>
          </div>
          {footer ? (
            <div className="border-t border-border bg-muted/20 px-4 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function DataTablePager({
  page,
  pageCount,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) {
    return (
      <p className="text-xs text-muted-foreground">
        {total} result{total === 1 ? "" : "s"}
      </p>
    );
  }

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <p>
        Page {page} of {pageCount} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <a className="font-medium text-foreground underline-offset-4 hover:underline" href={buildHref(page - 1)}>
            Previous
          </a>
        ) : (
          <span className="opacity-40">Previous</span>
        )}
        {page < pageCount ? (
          <a className="font-medium text-foreground underline-offset-4 hover:underline" href={buildHref(page + 1)}>
            Next
          </a>
        ) : (
          <span className="opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}

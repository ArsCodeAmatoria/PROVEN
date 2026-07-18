import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

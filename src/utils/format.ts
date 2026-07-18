import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

export function formatDate(
  value: Date | string | null | undefined,
  pattern = "MMM d, yyyy",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatRelative(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function isExpired(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? parseISO(value) : value;
  return isPast(date);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatHours(completed: number, required: number): string {
  return `${completed.toLocaleString()} / ${required.toLocaleString()} hrs`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

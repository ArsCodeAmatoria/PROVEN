import { hasDatabaseConfig } from "@/lib/env";
import type { PaginatedResult, PaginationParams, ServiceResult } from "@/types";

export function unavailable<T>(message: string): ServiceResult<T> {
  return { data: null, error: message };
}

export function success<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function failure<T>(error: unknown): ServiceResult<T> {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return { data: null, error: message };
}

export function getDatabaseConfigError(): string | null {
  if (!hasDatabaseConfig()) {
    return "Database is not configured. Set DATABASE_URL to your Supabase Postgres connection string.";
  }
  return null;
}

export function normalizePagination(params: PaginationParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

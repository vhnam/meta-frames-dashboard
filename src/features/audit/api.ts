import { queryOptions } from "@tanstack/vue-query";
import { http } from "#/shared/api/http";
import type { AuditAction, AuditEntry } from "./types";

export const auditKeys = {
  all: ["audit"] as const,
  list: () => [...auditKeys.all, "list"] as const,
};

/** Meta-Frame API audit entry, as returned by `GET /audit-logs`. */
interface ApiAuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actor?: string;
  createdAt: string;
}

/** Timestamps change on every write; they are noise next to the real edit. */
const IGNORED = new Set(["updated_at", "updatedAt"]);

export function diffRows(before: ApiAuditLog["before"], after: ApiAuditLog["after"]) {
  const beforeFields = before ?? {};
  const afterFields = after ?? {};
  return [...new Set([...Object.keys(beforeFields), ...Object.keys(afterFields)])]
    .filter(
      (field) =>
        !IGNORED.has(field) &&
        JSON.stringify(beforeFields[field]) !== JSON.stringify(afterFields[field]),
    )
    .map((field) => ({ field, before: beforeFields[field], after: afterFields[field] }));
}

const toEntry = (log: ApiAuditLog): AuditEntry => ({
  id: log.id,
  entityType: log.entityType,
  entityId: log.entityId,
  action: log.action,
  actor: log.actor ?? "",
  changes: diffRows(log.before, log.after),
  createdAt: log.createdAt,
});

/** The API caps a page at 200 entries; the table filters and pages these client-side. */
const LIMIT = 200;

export const auditQueries = {
  list: () =>
    queryOptions({
      queryKey: auditKeys.list(),
      queryFn: async (): Promise<AuditEntry[]> => {
        const { data } = await http.get<ApiAuditLog[]>("/audit-logs", { params: { limit: LIMIT } });
        return data.map(toEntry);
      },
    }),
};

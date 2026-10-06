export const AUDIT_ACTIONS = ["create", "update", "delete"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actor: string;
  /** Columns whose value differs between the before and after row. */
  changes: { field: string; before: unknown; after: unknown }[];
  createdAt: string;
}

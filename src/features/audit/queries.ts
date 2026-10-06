import { useQuery } from "@tanstack/vue-query";
import { auditQueries } from "./api";

export const useAuditLog = () => useQuery(auditQueries.list());

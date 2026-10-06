import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryFilters,
  type QueryKey,
} from "@tanstack/vue-query";
import { toast } from "vue-sonner";

/** Optimistically patches every cached query under `filters`; returns a rollback. */
export function patchQueries<T>(
  qc: QueryClient,
  filters: QueryFilters,
  updater: (old: T) => T,
): () => void {
  const previous = qc.getQueriesData<T>(filters);
  qc.setQueriesData<T>(filters, (old) => (old === undefined ? old : updater(old)));
  return () => {
    for (const [key, data] of previous) qc.setQueryData(key, data);
  };
}

interface MutationSpec<TVars, TData> {
  /** Domain action. Rule violations should throw. */
  fn: (vars: TVars) => TData | Promise<TData>;
  /** Targeted invalidation: only the keys this write can affect. */
  invalidates: (vars: TVars, data: TData) => readonly QueryKey[];
  success?: string | ((vars: TVars, data: TData) => string);
  /**
   * Apply an optimistic cache patch. Return a rollback function (use
   * patchQueries). In-flight fetches for `cancel` keys are cancelled first so
   * they cannot overwrite the optimistic value.
   */
  optimistic?: {
    cancel: (vars: TVars) => readonly QueryKey[];
    apply: (qc: QueryClient, vars: TVars) => () => void;
  };
}

/**
 * One shape for every write: optimistic patch (optional), rollback on error,
 * then targeted invalidation once the mutation settles.
 */
export function useApiMutation<TVars, TData = void>(spec: MutationSpec<TVars, TData>) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVars, { rollback?: () => void }>({
    mutationFn: (vars) => Promise.resolve(spec.fn(vars)),
    onMutate: async (vars: TVars) => {
      if (!spec.optimistic) return {};
      await Promise.all(
        spec.optimistic.cancel(vars).map((queryKey) => qc.cancelQueries({ queryKey })),
      );
      return { rollback: spec.optimistic.apply(qc, vars) };
    },
    onError: (_error, _vars, context) => context?.rollback?.(),
    onSuccess: (data, vars) => {
      const message = typeof spec.success === "function" ? spec.success(vars, data) : spec.success;
      if (message) toast.success(message);
    },
    onSettled: async (data, _error, vars) => {
      await Promise.all(
        spec.invalidates(vars, data as TData).map((queryKey) => qc.invalidateQueries({ queryKey })),
      );
    },
  });
}

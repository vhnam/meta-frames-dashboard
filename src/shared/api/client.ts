import { MutationCache, QueryClient } from "@tanstack/vue-query";
import { toast } from "vue-sonner";

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong.";

/** Server state lives only here. Mutation failures are reported centrally. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
  mutationCache: new MutationCache({
    onError: (error, _vars, _context, mutation) => {
      if (!mutation.meta?.quiet) toast.error(errorMessage(error));
    },
  }),
});

declare module "@tanstack/vue-query" {
  interface Register {
    mutationMeta: {
      /** Skip the central error toast; the caller shows the error inline. */
      quiet?: boolean;
    };
  }
}

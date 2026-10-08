import { shallowRef } from "vue";

/** The open confirmation; ConfirmDialog in the root layout renders it. */
export const pendingAsk = shallowRef<{ message: string; resolve: (ok: boolean) => void }>();

/** Asks the user to confirm a deletion; resolves false on Cancel, Escape or a newer ask. */
export function ask(message: string): Promise<boolean> {
  pendingAsk.value?.resolve(false);
  return new Promise((resolve) => {
    pendingAsk.value = { message, resolve };
  });
}

/** Awaits a mutation; failures are already toasted centrally by the MutationCache. */
export async function attempt(promise: Promise<unknown>): Promise<boolean> {
  try {
    await promise;
    return true;
  } catch {
    return false;
  }
}

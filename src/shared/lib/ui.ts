export const ask = (message: string) => window.confirm(message);

/** Awaits a mutation; failures are already toasted centrally by the MutationCache. */
export async function attempt(promise: Promise<unknown>): Promise<boolean> {
  try {
    await promise;
    return true;
  } catch {
    return false;
  }
}

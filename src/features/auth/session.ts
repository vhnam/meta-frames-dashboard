import { queryClient } from "#/shared/api/client";
import { authQueries } from "./api";

/** Resolves the signed-in user (cached), or `null` when logged out. */
export const currentUser = () =>
  queryClient.ensureQueryData({ ...authQueries.me(), revalidateIfStale: true });

/** Only paths inside the app are allowed as a post-login target; anything else becomes `/app`. */
export function safeRedirect(target: unknown): string {
  return typeof target === "string" && /^\/app(?:[/?#]|$)/.test(target) ? target : "/app";
}

/** Messages for `?error=<code>` on the login page after a failed Google sign-in. */
export const googleErrors: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  email_not_verified: "Your Google email address is not verified.",
  account_conflict: "This email's account is linked to another Google account.",
  account_locked: "Your account is locked. Try again in 15 minutes.",
  google_failed: "Sign-in with Google failed. Try again.",
};

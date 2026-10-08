import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRouter } from "@tanstack/vue-router";
import { toast } from "vue-sonner";
import {
  authKeys,
  authQueries,
  login,
  logout,
  register,
  resetPassword,
  startRecovery,
} from "./api";
import type { User } from "./types";

export const useCurrentUser = () => useQuery(authQueries.me());

/** Login and register store the new user so guarded routes see the session at once. */
const useSignIn = <TVars>(fn: (vars: TVars) => Promise<User>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    meta: { quiet: true },
    onSuccess: (user) => qc.setQueryData(authKeys.me(), user),
  });
};

export const useLogin = () => useSignIn(login);
export const useRegister = () => useSignIn(register);

export const useStartRecovery = () =>
  useMutation({ mutationFn: startRecovery, meta: { quiet: true } });

export const useResetPassword = () =>
  useMutation({ mutationFn: resetPassword, meta: { quiet: true } });

/** Ends the session, leaves the app and drops every cached record of the previous user. */
export const useLogout = () => {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      qc.setQueryData(authKeys.me(), null);
      await router.navigate({ to: "/auth/login" });
      qc.clear();
      toast.success("You have been logged out");
    },
  });
};

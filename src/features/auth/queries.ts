import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from '@tanstack/vue-router';

import { notify } from '#/shared/lib/toast';

import {
  authKeys,
  authQueries,
  login,
  logout,
  register,
  resetPassword,
  startRecovery,
} from './api';
import type { User } from './types';

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

/** Registration stores a user only when the server opened a session; otherwise the email needs verifying. */
export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: register,
    meta: { quiet: true },
    onSuccess: (result) => {
      if ('user' in result) qc.setQueryData(authKeys.me(), result.user);
    },
  });
};

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
      await router.navigate({ to: '/auth/login' });
      qc.clear();
      notify.success('You have been logged out');
    },
  });
};

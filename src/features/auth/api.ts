import { queryOptions } from "@tanstack/vue-query";
import { isAxiosError } from "axios";
import { http } from "#/shared/api/http";
import type { User } from "./types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export interface ApiUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

interface AuthResult {
  message: string;
  user?: ApiUser;
}

const toUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  email: apiUser.email,
  name: apiUser.name ?? "",
  createdAt: apiUser.createdAt,
});

const fetchMe = async () => toUser((await http.get<ApiUser>("/auth/me")).data);

export const authQueries = {
  /** The signed-in user, or `null` without a valid session. */
  me: () =>
    queryOptions({
      queryKey: authKeys.me(),
      queryFn: async (): Promise<User | null> => {
        try {
          return await fetchMe();
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) return null;
          throw error;
        }
      },
      staleTime: 5 * 60_000,
    }),
};

export const login = async (variables: { email: string; password: string }): Promise<User> => {
  const { data } = await http.post<AuthResult>("/auth/login", variables);
  return data.user ? toUser(data.user) : fetchMe();
};

export const register = async (variables: {
  email: string;
  password: string;
  name: string;
}): Promise<User> => {
  const body = {
    email: variables.email,
    password: variables.password,
    name: variables.name.trim() || undefined,
  };
  const { data } = await http.post<AuthResult>("/auth/register", body);
  return data.user ? toUser(data.user) : fetchMe();
};

export const logout = async () => {
  await http.post("/auth/logout");
};

/** Emails a reset link. The answer is the same whether or not the account exists. */
export const startRecovery = async (variables: { email: string }) =>
  (await http.post<AuthResult>("/auth/recover", variables)).data.message;

export const resetPassword = async (variables: { token: string; password: string }) => {
  await http.post("/auth/recover/end", variables);
};

/** Where the browser goes for "Sign in with Google"; the API lands it back on `redir`. */
export const googleSignInUrl = (redir: string) =>
  `${(http.defaults.baseURL ?? "").replace(/\/$/, "")}/auth/oauth2/google?${new URLSearchParams({ redir })}`;

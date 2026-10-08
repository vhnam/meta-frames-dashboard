import axios, { isAxiosError } from "axios";

/** Shared axios instance for the Meta-Frame API. Sends the session cookie on every request. */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let onUnauthorized: (() => void) | undefined;

/** Called when a request outside `/auth/*` answers `401` (the session expired or was ended). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// API errors always look like `{ code, message }`: surface the message.
http.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError<{ code?: string; message?: string }>(error)) {
    const message = error.response?.data?.message;
    // keep the AxiosError (callers read `response.status`), but show the server's message
    if (message) error.message = message;
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
      onUnauthorized?.();
    }
  }
  return Promise.reject(error);
});

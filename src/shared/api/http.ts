import axios, { isAxiosError } from "axios";

/** Shared axios instance for the Meta-Frame REST API. */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
    // attributes every change in the audit trail (GET /audit-logs)
    ...(import.meta.env.VITE_ACTOR ? { "X-Actor": import.meta.env.VITE_ACTOR } : {}),
  },
});

// API errors always look like `{ code, message }`: surface the message.
http.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError<{ code?: string; message?: string }>(error)) {
    const message = error.response?.data?.message;
    // keep the AxiosError (callers read `response.status`), but show the server's message
    if (message) error.message = message;
  }
  return Promise.reject(error);
});

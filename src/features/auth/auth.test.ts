// @vitest-environment happy-dom
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { router } from "#/app/router";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import { authKeys, authQueries } from "./api";
import { RegisterSchema, ResetPasswordSchema } from "./schema";
import { safeRedirect } from "./session";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const user = {
  id: "5a0c2f6e-8d31-4b7a-9e15-3c7f1d2b4a60",
  email: "ansel@example.com",
  name: "Ansel",
  createdAt: "2026-10-07T09:00:00Z",
};

let signedIn = false;
http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
  const respond = (status: number, data: unknown) => {
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400)
      throw new AxiosError(`HTTP ${status}`, "ERR_BAD_REQUEST", config, null, response);
    return response;
  };
  if (!signedIn) return respond(401, { code: "unauthorized", message: "not logged in" });
  if (config.url === "/auth/me") return respond(200, user);
  return respond(200, []);
};

beforeEach(() => {
  signedIn = false;
  queryClient.clear();
});

describe("safeRedirect", () => {
  it("keeps paths inside the app", () => {
    expect(safeRedirect("/app/rolls/abc?page=2")).toBe("/app/rolls/abc?page=2");
    expect(safeRedirect("/app")).toBe("/app");
  });

  it("falls back to /app for anything else", () => {
    for (const bad of [undefined, "", "/", "/apple", "//evil.com/app", "https://evil.com/app"])
      expect(safeRedirect(bad)).toBe("/app");
  });
});

describe("password schemas", () => {
  const issues = (schema: typeof ResetPasswordSchema, input: unknown) =>
    v.safeParse(schema, input).issues?.map((i) => i.message) ?? [];

  it("requires the API's password strength", () => {
    expect(issues(ResetPasswordSchema, { password: "weak", confirmPassword: "weak" })).toEqual(
      expect.arrayContaining(["Use at least 8 characters.", "Add an upper-case letter."]),
    );
  });

  it("requires the confirmation to match", () => {
    expect(
      v.safeParse(RegisterSchema, {
        name: "",
        email: "ansel@example.com",
        password: "Zone-System5",
        confirmPassword: "Zone-System6",
      }).issues?.[0]?.message,
    ).toBe("Passwords do not match.");
  });
});

describe("session", () => {
  it("reads a missing session as null", async () => {
    await expect(queryClient.fetchQuery(authQueries.me())).resolves.toBeNull();
  });

  it("sends a visitor from the app to login, remembering where they were", async () => {
    await router.navigate({ to: "/app/rolls" });
    expect(router.state.location.pathname).toBe("/auth/login");
    expect(router.state.location.search).toMatchObject({ redirect: "/app/rolls" });
  });

  it("sends a signed-in user from login on to the app", async () => {
    signedIn = true;
    await router.navigate({ to: "/auth/login", search: { redirect: "/app/labs" } });
    expect(router.state.location.pathname).toBe("/app/labs");
  });

  it("returns to login when the API ends the session", async () => {
    signedIn = true;
    await router.navigate({ to: "/app/rolls" });
    expect(router.state.location.pathname).toBe("/app/rolls");
    signedIn = false;
    await http.get("/rolls").catch(() => {});
    await vi.waitFor(() => expect(router.state.location.pathname).toBe("/auth/login"));
    expect(queryClient.getQueryData(authKeys.me())).toBeNull();
  });

  it("forwards the API's legacy /login link with its query", async () => {
    await router.navigate({ href: "/login?error=google_denied" });
    expect(router.state.location.pathname).toBe("/auth/login");
    expect(router.state.location.search).toMatchObject({ error: "google_denied" });
  });
});

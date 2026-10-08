// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { router } from "#/app/router";
import { authKeys } from "#/features/auth";
import { queryClient } from "#/shared/api/client";
import { rememberList } from "#/shared/lib/listSearch";
import { backToListing } from "./listBack";

describe("backToListing", () => {
  beforeEach(() => sessionStorage.clear());

  it("stays hidden on a listing page", () => {
    expect(backToListing("/app/rolls", {})).toBeNull();
    expect(backToListing("/app/expiry", {})).toBeNull();
  });

  it("returns to the parent listing without pager params at the defaults", () => {
    expect(backToListing("/app/rolls/roll-1", {})).toEqual({ to: "/app/rolls", search: {} });
  });

  it("keeps page and page size from the current URL", () => {
    expect(backToListing("/app/cameras/cam-1", { page: "3", pageSize: "20" })).toEqual({
      to: "/app/cameras",
      search: { page: 3, pageSize: 20 },
    });
  });

  it("uses the listing's remembered pager when the URL has none", () => {
    rememberList("/app/stocks", 2, 50);
    expect(backToListing("/app/stocks/stock-1", {})).toEqual({
      to: "/app/stocks",
      search: { page: 2, pageSize: 50 },
    });
  });

  it("leaves the default page and page size off the link", () => {
    rememberList("/app/rolls", 1, 10);
    expect(backToListing("/app/rolls/roll-1", {})).toEqual({ to: "/app/rolls", search: {} });
  });
});

describe("list search on navigation", () => {
  it("carries page and page size onto a detail when the link passes them", async () => {
    // signed in, so the /app guard lets the navigation through
    queryClient.setQueryData(authKeys.me(), {
      id: "u1",
      email: "ansel@example.com",
      name: "Ansel",
      createdAt: "2026-10-07T09:00:00Z",
    });
    const search = { page: 2, pageSize: 20 };
    await router.navigate({ to: "/app/rolls", search });
    await router.navigate({ to: "/app/rolls/$rollId", params: { rollId: "abc" }, search });
    expect(router.state.location.pathname).toBe("/app/rolls/abc");
    expect(backToListing(router.state.location.pathname, router.state.location.search)).toEqual({
      to: "/app/rolls",
      search,
    });
  });
});

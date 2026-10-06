// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { router } from "#/app/router";
import { rememberList } from "#/shared/lib/listSearch";
import { backToListing } from "./listBack";

describe("backToListing", () => {
  beforeEach(() => sessionStorage.clear());

  it("stays hidden on a listing page", () => {
    expect(backToListing("/rolls", {})).toBeNull();
    expect(backToListing("/expiry", {})).toBeNull();
  });

  it("returns to the parent listing without pager params at the defaults", () => {
    expect(backToListing("/rolls/roll-1", {})).toEqual({ to: "/rolls", search: {} });
  });

  it("keeps page and page size from the current URL", () => {
    expect(backToListing("/cameras/cam-1", { page: "3", pageSize: "20" })).toEqual({
      to: "/cameras",
      search: { page: 3, pageSize: 20 },
    });
  });

  it("uses the listing's remembered pager when the URL has none", () => {
    rememberList("/stocks", 2, 50);
    expect(backToListing("/stocks/stock-1", {})).toEqual({
      to: "/stocks",
      search: { page: 2, pageSize: 50 },
    });
  });

  it("leaves the default page and page size off the link", () => {
    rememberList("/rolls", 1, 10);
    expect(backToListing("/rolls/roll-1", {})).toEqual({ to: "/rolls", search: {} });
  });
});

describe("list search on navigation", () => {
  it("carries page and page size onto a detail when the link passes them", async () => {
    const search = { page: 2, pageSize: 20 };
    await router.navigate({ to: "/rolls", search });
    await router.navigate({ to: "/rolls/$rollId", params: { rollId: "abc" }, search });
    expect(router.state.location.pathname).toBe("/rolls/abc");
    expect(backToListing(router.state.location.pathname, router.state.location.search)).toEqual({
      to: "/rolls",
      search,
    });
  });
});

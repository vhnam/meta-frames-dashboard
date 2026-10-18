// @vitest-environment happy-dom
import { VueQueryPlugin, useQuery } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { installFakeServer, server } from "#/test/fakeServer";
import { cameraKeys, useCameraList, useSetCameraActive } from "#/features/cameras";
import { lensKeys, useLensList, useSetLensActive } from "#/features/lenses";
import { rollKeys, useRollList } from "#/features/rolls";
import { queryClient } from "#/shared/api/client";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

installFakeServer();

/** Mounts a component under the app's real QueryClient. */
function withQueries<TApi>(setup: () => TApi) {
  let api!: TApi;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = setup();
        return () => h("div");
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  );
  return { api, wrapper };
}

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("query keys", () => {
  it("nest from broad to narrow so a prefix invalidates everything beneath it", () => {
    expect(rollKeys.detail("r1").slice(0, 2)).toEqual(rollKeys.details());
    expect(rollKeys.list({ status: "in_stock" }).slice(0, 2)).toEqual(rollKeys.lists());
    expect(rollKeys.lists().slice(0, 1)).toEqual(rollKeys.all);
    expect(cameraKeys.list({ includeInactive: true })).not.toEqual(
      cameraKeys.list({ includeInactive: false }),
    );
  });
});

describe("read boundary", () => {
  it("maps API cameras to the shapes the UI uses", async () => {
    server.addCamera({ brand: "Canon", model: "AE-1", mount: "FD", description: "Black body" });
    const { api } = withQueries(() => useCameraList());
    await vi.waitFor(() => expect(api.data.value).toHaveLength(1));
    expect(api.data.value![0].camera).toMatchObject({
      brand: "Canon",
      model: "AE-1",
      mount: "FD",
      description: "Black body",
      fixedLens: false,
      active: true,
    });
  });

  it("maps the loaded roll of a camera", async () => {
    const cam = server.addCamera();
    server.addRoll({ cameraId: cam.id, status: "in_camera" });
    const { api } = withQueries(() => useCameraList());
    await vi.waitFor(() => expect(api.data.value?.[0].loaded).toBeTruthy());
  });
});

describe("optimistic mutation", () => {
  it("applies the patch immediately, then settles to server state", async () => {
    const lens = server.addLens();
    const { api } = withQueries(() => ({ list: useLensList(), set: useSetLensActive() }));
    await vi.waitFor(() => expect(api.list.data.value).toHaveLength(1));

    const pending = api.set.mutateAsync({ id: lens.id, active: false });
    await vi.waitFor(() => expect(api.list.data.value![0].lens.active).toBe(false)); // optimistic
    await pending;
    expect(server.lenses[0].isActive).toBe(false); // committed
  });

  it("rolls back when the server rejects the write", async () => {
    // a built-in lens cannot be deactivated on its own
    server.addCamera({ hasFixedLens: true });
    const { api } = withQueries(() => ({ list: useLensList(), set: useSetLensActive() }));
    await vi.waitFor(() => expect(api.list.data.value).toHaveLength(1));

    await expect(api.set.mutateAsync({ id: server.lenses[0].id, active: false })).rejects.toThrow(
      /follows its camera/,
    );
    await vi.waitFor(() => expect(api.list.data.value![0].lens.active).toBe(true)); // rolled back
  });
});

describe("targeted invalidation", () => {
  it("refetches only the affected domains", async () => {
    const cam = server.addCamera({}, { brand: "Canon" });
    server.addLens();
    const { api } = withQueries(() => ({
      cameras: useCameraList(),
      lenses: useLensList(),
      rolls: useRollList({}),
      setActive: useSetCameraActive(),
    }));
    await vi.waitFor(() => {
      expect(api.cameras.data.value).toBeDefined();
      expect(api.lenses.data.value).toBeDefined();
      expect(api.rolls.data.value).toBeDefined();
    });
    const stamp = () => ({
      cameras: queryClient.getQueryState(cameraKeys.list({ includeInactive: false }))!
        .dataUpdatedAt,
      lenses: queryClient.getQueryState(lensKeys.list())!.dataUpdatedAt,
      rolls: queryClient.getQueryState(rollKeys.list({}))!.dataUpdatedAt,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const before = stamp();

    await api.setActive.mutateAsync({ id: cam.id, active: false });
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(stamp().cameras).toBeGreaterThan(before.cameras); // camera lists refetched
    expect(stamp().rolls).toBe(before.rolls); // roll lists untouched
    expect(stamp().lenses).toBeGreaterThan(before.lenses); // built-in lens follows the camera
  });
});

describe("QueryBoundary states", () => {
  function boundary(queryFn: () => Promise<string[]>, opts: { staleTime?: number } = {}) {
    let result!: ReturnType<typeof useQuery<string[], Error>>;
    const wrapper = mount(
      defineComponent({
        setup() {
          result = useQuery<string[], Error>({
            queryKey: ["test", Math.random()],
            queryFn,
            retry: false,
            staleTime: opts.staleTime ?? 0,
          });
          return () =>
            h(
              QueryBoundary,
              { query: result, emptyText: "Nothing here." },
              {
                default: ({ data }: { data: string[] }) =>
                  h(
                    "ul",
                    data.map((item) => h("li", item)),
                  ),
              },
            );
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );
    return {
      wrapper,
      get q() {
        return result;
      },
    };
  }

  it("loading → data", async () => {
    const view = boundary(async () => ["a", "b"]);
    expect(view.wrapper.find("[role=status]").exists()).toBe(true);
    await vi.waitFor(() => expect(view.wrapper.findAll("li")).toHaveLength(2));
  });

  it("empty", async () => {
    const view = boundary(async () => []);
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("Nothing here."));
  });

  it("error with retry", async () => {
    let calls = 0;
    const view = boundary(async () => {
      if (++calls === 1) throw new Error("boom");
      return ["ok"];
    });
    await vi.waitFor(() => expect(view.wrapper.find("[role=alert]").text()).toContain("boom"));
    await view.wrapper.find("[role=alert] button").trigger("click");
    await vi.waitFor(() => expect(view.wrapper.findAll("li")).toHaveLength(1));
  });

  it("background refetch keeps data visible and says it is updating", async () => {
    let release!: () => void;
    let counter = 0;
    const view = boundary(async () => {
      if (++counter === 1) return ["first"];
      await new Promise<void>((resolve) => (release = resolve));
      return ["second"];
    });
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("first"));
    void view.q.refetch();
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("Updating…"));
    expect(view.wrapper.text()).toContain("first"); // data stays
    release();
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("second"));
  });

  it("failed refresh keeps stale data and offers retry", async () => {
    let counter = 0;
    const view = boundary(async () => {
      if (++counter === 2) throw new Error("offline");
      return ["cached"];
    });
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("cached"));
    await view.q.refetch();
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("Couldn't refresh"));
    expect(view.wrapper.text()).toContain("cached");
  });

  it("stale data shows no freshness bar", async () => {
    const view = boundary(async () => ["x"], { staleTime: 0 });
    await vi.waitFor(() => expect(view.wrapper.text()).toContain("x"));
    expect(view.wrapper.text()).not.toContain("Updated");
    expect(view.wrapper.text()).not.toContain("Refresh");
  });
});

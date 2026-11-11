// @vitest-environment happy-dom
import { rollQueries } from "../../api";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { SelectStub } from "#/test/selectStub";
import type { RollDetail } from "../../types";
import ProcessingHistoryCard from "./ProcessingHistoryCard.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  document.body.innerHTML = "";
  server.reset();
  queryClient.clear();
});

/** A developed roll waiting for its scan at home. */
async function mountCard(overrides: Partial<RollDetail> = {}) {
  const roll = server.addRoll({ status: "developed", finishedAt: "2026-10-01" });
  const detail = await queryClient.fetchQuery(rollQueries.detail(roll.id));
  const loaded: RollDetail = { ...detail!, stageDetail: "waiting_home_scan", ...overrides };
  const wrapper = mount(ProcessingHistoryCard, {
    props: {
      detail: loaded,
      row: {
        roll: loaded.roll,
        stockName: "",
        boxIso: "",
        cameraName: null,
        negativesAtLab: false,
      },
    },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
  });
  return { wrapper, roll };
}

/** Opens the Actions menu and picks the item with this text. */
async function choose(wrapper: Awaited<ReturnType<typeof mountCard>>["wrapper"], text: string) {
  const trigger = wrapper.findAll("button").find((candidate) => candidate.text() === "Actions")!;
  await trigger.trigger("keydown", { key: "Enter" });
  const item = await vi.waitFor(() => {
    const found = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((element) =>
      element.textContent?.trim().startsWith(text),
    );
    expect(found).toBeDefined();
    return found!;
  });
  item.click();
}

describe("ProcessingHistoryCard", () => {
  it("starts a home scan on the owner's own scanner and leaves the job open", async () => {
    const own = server.addScanner({ brand: "Plustek" });
    const { wrapper, roll } = await mountCard();
    await vi.waitFor(() => expect(queryClient.getQueryData(["scanners", "list"])).toBeTruthy());
    await choose(wrapper, "Start scanning at home");
    await flushPromises();
    const job = server.requests.find(
      (request) =>
        request.method === "put" && request.url.startsWith(`/rolls/${roll.id}/processing/`),
    );
    expect(job?.body).toMatchObject({ type: "scan", scanOrders: [{ scannerId: own.id }] });
    expect(job?.body).not.toHaveProperty("labId");
    expect(server.requests.some((request) => request.url.endsWith("/scans-received"))).toBe(false);
  });

  it("does not start a home scan without an own scanner", async () => {
    const { wrapper } = await mountCard();
    await vi.waitFor(() => expect(queryClient.getQueryData(["scanners", "list"])).toBeTruthy());
    await choose(wrapper, "Start scanning at home");
    await flushPromises();
    expect(server.requests.some((request) => request.url.includes("/processing/"))).toBe(false);
  });

  it("removes the scan mark of a marked roll", async () => {
    const { wrapper, roll } = await mountCard({ stageDetail: null, needsScan: true });
    await choose(wrapper, "Remove needs scan");
    await flushPromises();
    expect(
      server.requests.filter((request) => request.url === `/rolls/${roll.id}/scan-request`),
    ).toMatchObject([{ method: "delete" }]);
  });
});

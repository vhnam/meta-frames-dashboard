// @vitest-environment happy-dom
import { rollQueries } from "../api";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { SelectStub } from "#/test/selectStub";
import SendToLabDialog from "./SendToLabDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

async function mountRescan() {
  const stock = server.addStock({ name: "Portra", brand: "Kodak" });
  const rec = server.addRoll({ filmStockId: stock.id, status: "scanned" });
  const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
    (row) => row.roll.id === rec.id,
  )!;
  const wrapper = mount(SendToLabDialog, {
    attachTo: document.body,
    props: { open: false, row, types: ["scan"], rescan: true },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
  });
  await wrapper.setProps({ open: true } as never);
  await flushPromises();
  return { wrapper, rollId: rec.id };
}

const submit = () =>
  (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
const jobPut = () =>
  server.requests.find((request) => request.method === "put" && request.url.startsWith("/rolls/"))
    ?.body as Record<string, unknown> | undefined;
const receipts = () =>
  server.requests
    .filter((request) => request.method === "put" && request.url.startsWith("/processing/"))
    .map((request) => ({ what: request.url.split("/").pop(), body: request.body }));
const today = () => new Date().toLocaleDateString("en-CA");

describe("SendToLabDialog re-scan", () => {
  it("scans at home on another scanner by default", async () => {
    const { wrapper } = await mountRescan();
    expect(document.body.textContent).toContain("Re-scan Roll");
    expect(document.body.textContent).toContain("Self-scan (at home)");
    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({
      type: "scan",
      scanOrders: [{ scanner: "other", hiRes: false }],
    });
    expect(jobPut()!.labId).toBeUndefined();
    // scanned at home: done when recorded, so the scans are received the same day
    await vi.waitFor(() =>
      expect(receipts()).toEqual([{ what: "scans-received", body: { date: today() } }]),
    );
    wrapper.unmount();
  });

  it("switches to the lab's scanner when a lab is picked", async () => {
    const lab = server.addLab({ name: "Saigon Film Lab" });
    const { wrapper } = await mountRescan();
    await vi.waitFor(() =>
      expect(document.body.querySelector(`option[value="${lab.id}"]`)).not.toBeNull(),
    );
    const labSelect = document.body.querySelector("select") as HTMLSelectElement;
    labSelect.value = lab.id;
    labSelect.dispatchEvent(new Event("change"));
    await flushPromises();
    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({
      type: "scan",
      labId: lab.id,
      scanOrders: [{ scanner: "noritsu", hiRes: false }],
    });
    await flushPromises();
    expect(receipts()).toEqual([]);
    wrapper.unmount();
  });
});

describe("SendToLabDialog at home", () => {
  it("records negatives developed and scans as done", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "done_shooting" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const wrapper = mount(SendToLabDialog, {
      attachTo: document.body,
      props: { open: false, row, types: ["develop_scan"] },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    expect(document.body.textContent).toContain("Negatives developed");
    expect(document.body.textContent).not.toContain("expected back");
    submit();
    await vi.waitFor(() => expect(receipts()).toHaveLength(2));
    expect(jobPut()).toMatchObject({ type: "develop_scan" });
    expect(receipts()).toEqual([
      { what: "scans-received", body: { date: today() } },
      { what: "negatives-returned", body: { date: today() } },
    ]);
    wrapper.unmount();
  });
});

describe("SendToLabDialog editing a job", () => {
  it("keeps the lab and lets a home develop job add scanning", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "developed" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const job = {
      id: "job-1",
      labId: null,
      labName: "Self-develop",
      type: "develop" as const,
      process: "C-41" as const,
      sentDate: "2026-10-01",
      scansExpectedDate: null,
      negativesExpectedDate: null,
      scansReceivedDate: null,
      negativesReturnedDate: "2026-10-01",
      price: null,
      notes: "",
      scanOrders: [],
      open: false,
    };
    const wrapper = mount(SendToLabDialog, {
      attachTo: document.body,
      props: { open: false, row, job },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const [labSelect, serviceSelect] = document.body.querySelectorAll("select");
    expect(labSelect.disabled).toBe(true);
    expect([...serviceSelect.options].map((option) => option.value)).toEqual([
      "develop",
      "develop_scan",
    ]);
    serviceSelect.value = "develop_scan";
    serviceSelect.dispatchEvent(new Event("change"));
    await flushPromises();
    const scanned = [...document.body.querySelectorAll("label")].find((label) =>
      label.textContent?.trim().startsWith("Scanned"),
    );
    expect(scanned).toBeDefined();
    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({
      type: "develop_scan",
      scanOrders: [{ scanner: "other", hiRes: false }],
    });
    wrapper.unmount();
  });
});

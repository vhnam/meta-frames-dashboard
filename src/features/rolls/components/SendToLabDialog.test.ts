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

const NORITSU = "d177cb3c-a850-4232-a4ca-75189b7b279b";

describe("SendToLabDialog re-scan", () => {
  it("scans at home on your own scanner by default", async () => {
    const epson = server.addScanner();
    const { wrapper } = await mountRescan();
    expect(document.body.textContent).toContain("Re-scan Roll");
    expect(document.body.textContent).toContain("Self-scan (at home)");
    await vi.waitFor(() => expect(document.body.textContent).toContain("Epson V850"));
    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({
      type: "scan",
      scanOrders: [{ scannerId: epson.id, settings: { dpi: 3200, dust_removal: false } }],
    });
    expect(jobPut()!.labId).toBeUndefined();
    // scanned at home: done when recorded, so the scans are received the same day
    await vi.waitFor(() =>
      expect(receipts()).toEqual([{ what: "scans-received", body: { date: today() } }]),
    );
    wrapper.unmount();
  });

  it("asks for a scanner at home when you have none of your own", async () => {
    const { wrapper } = await mountRescan();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Noritsu HS-1800"));
    submit();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Pick at least one scanner."),
    );
    expect(jobPut()).toBeUndefined();
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
      scanOrders: [{ scannerId: NORITSU, settings: { resolution: "standard" } }],
    });
    await flushPromises();
    expect(receipts()).toEqual([]);
    wrapper.unmount();
  });
  it("offers the scanners the lab runs, its default first", async () => {
    // this lab runs a Noritsu whose model nobody knows, and a Frontier
    const noritsu = server.addScanner({ brand: "Noritsu", model: "", kind: "minilab" });
    const FRONTIER = "e2bf4cbd-87a8-4a17-8340-516b1a1cc6bc";
    const lab = server.addLab({
      name: "Other Lab",
      scannerIds: [noritsu.id, FRONTIER],
      defaultScannerId: noritsu.id,
    });
    const { wrapper } = await mountRescan();
    await vi.waitFor(() =>
      expect(document.body.querySelector(`option[value="${lab.id}"]`)).not.toBeNull(),
    );
    const labSelect = document.body.querySelector("select") as HTMLSelectElement;
    labSelect.value = lab.id;
    labSelect.dispatchEvent(new Event("change"));
    await flushPromises();
    const picker = document.body.querySelector("fieldset")!.textContent!;
    expect(picker).toContain("Frontier SP-3000");
    expect(picker).not.toContain("Noritsu HS-1800");
    expect(picker).toContain("Show all scanners");
    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({ labId: lab.id, scanOrders: [{ scannerId: noritsu.id }] });
    wrapper.unmount();
  });
  it("picks no scanner for a lab that runs scanners but has no default", async () => {
    const FRONTIER = "e2bf4cbd-87a8-4a17-8340-516b1a1cc6bc";
    const lab = server.addLab({ name: "Other Lab", scannerIds: [FRONTIER] });
    const { wrapper } = await mountRescan();
    await vi.waitFor(() =>
      expect(document.body.querySelector(`option[value="${lab.id}"]`)).not.toBeNull(),
    );
    const labSelect = document.body.querySelector("select") as HTMLSelectElement;
    labSelect.value = lab.id;
    labSelect.dispatchEvent(new Event("change"));
    await flushPromises();
    const picker = document.body.querySelector("fieldset")!;
    expect(picker.textContent).toContain("Frontier SP-3000");
    expect(picker.querySelector("[role=checkbox][aria-checked=true]")).toBeNull();
    submit();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Pick at least one scanner."),
    );
    expect(jobPut()).toBeUndefined();
    wrapper.unmount();
  });
});

describe("SendToLabDialog scan settings", () => {
  it("orders the lab's scanner with the settings picked for it", async () => {
    const lab = server.addLab({ name: "Saigon Film Lab" });
    const { wrapper } = await mountRescan();
    await vi.waitFor(() =>
      expect(document.body.querySelector(`option[value="${lab.id}"]`)).not.toBeNull(),
    );
    const labSelect = document.body.querySelector("select") as HTMLSelectElement;
    labSelect.value = lab.id;
    labSelect.dispatchEvent(new Event("change"));
    await flushPromises();
    // the order's settings fold under a summary; opening it shows a field per option
    const summary = [...document.body.querySelectorAll("button[aria-expanded]")].find(
      (button) => button.textContent?.trim() === "Standard",
    ) as HTMLButtonElement;
    summary.click();
    await flushPromises();
    const resolution = document.body.querySelector(
      `select[aria-label="Resolution"]`,
    ) as HTMLSelectElement;
    resolution.value = "hi_res";
    resolution.dispatchEvent(new Event("change"));
    await flushPromises();
    expect(summary.textContent?.trim()).toBe("Hi-res");
    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({
      scanOrders: [{ scannerId: NORITSU, settings: { resolution: "hi_res" } }],
    });
    wrapper.unmount();
  });
});

describe("SendToLabDialog at home", () => {
  it("records negatives developed and scans as done", async () => {
    server.addScanner();
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
    await vi.waitFor(() => expect(document.body.textContent).toContain("Epson V850"));
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
    const epson = server.addScanner();
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
      order: null,
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
      scanOrders: [{ scannerId: epson.id, settings: { dpi: 3200, dust_removal: false } }],
    });
    wrapper.unmount();
  });

  it.each(["print", "scan"] as const)("closes a %s job at a lab on the negatives", async (type) => {
    const lab = server.addLab({ name: "Saigon Film Lab" });
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "at_lab" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const job = {
      id: "job-2",
      labId: lab.id,
      labName: lab.name,
      type,
      process: "C-41" as const,
      sentDate: "2026-10-01",
      scansExpectedDate: null,
      negativesExpectedDate: null,
      scansReceivedDate: type === "scan" ? "2026-10-03" : null,
      negativesReturnedDate: null,
      price: null,
      order: null,
      notes: "",
      scanOrders:
        type === "scan"
          ? [
              {
                scannerId: NORITSU,
                scannerName: "Noritsu HS-1800",
                settings: { resolution: "hi_res" },
                scanCount: 0,
              },
            ]
          : [],
      open: type === "print",
    };
    const wrapper = mount(SendToLabDialog, {
      attachTo: document.body,
      props: { open: false, row, job },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    expect(document.body.textContent).toContain("Negatives received");
    // formisch names a field by its JSON path
    const returned = document.body.querySelector(
      "input[name='[\"negativesReturnedAt\"]']",
    ) as HTMLInputElement;
    returned.value = "2026-10-08";
    returned.dispatchEvent(new Event("input"));
    await flushPromises();
    submit();
    await vi.waitFor(() =>
      expect(receipts()).toContainEqual({
        what: "negatives-returned",
        body: { date: "2026-10-08" },
      }),
    );
    wrapper.unmount();
  });
});

describe("SendToLabDialog dates", () => {
  it("lays out a lab job's dates in three rows", async () => {
    const lab = server.addLab({ name: "Saigon Film Lab" });
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "at_lab" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (candidate) => candidate.roll.id === rec.id,
    )!;
    const job = {
      id: "job-3",
      labId: lab.id,
      labName: lab.name,
      type: "develop_scan",
      process: "C-41",
      sentDate: "2026-09-12",
      scanOrders: [],
      open: true,
    };
    const wrapper = mount(SendToLabDialog, {
      attachTo: document.body,
      props: { open: false, row, job: job as never },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const rowOf = (field: string) =>
      document.body
        .querySelector(`input[name='["${field}"]']`)!
        .closest(".sm\\:grid-cols-2")!
        .querySelectorAll("input[type=date]");
    const names = (field: string) => [...rowOf(field)].map((input) => input.getAttribute("name"));
    expect(names("sentAt")).toEqual(['["sentAt"]']);
    expect(names("scansExpectedAt")).toEqual(['["scansExpectedAt"]', '["scansReceivedAt"]']);
    expect(names("negativesExpectedAt")).toEqual([
      '["negativesExpectedAt"]',
      '["negativesReturnedAt"]',
    ]);
    expect(document.body.textContent).toContain("Sent to Lab");
    expect(document.body.textContent).toContain("Negatives received");
    wrapper.unmount();
  });
});

describe("SendToLabDialog printing at home", () => {
  it("records the day the prints were made", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "developed" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const wrapper = mount(SendToLabDialog, {
      attachTo: document.body,
      props: { open: false, row, types: ["print"] },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    expect(document.body.textContent).toContain("Printed");
    submit();
    await vi.waitFor(() =>
      expect(receipts()).toEqual([{ what: "negatives-returned", body: { date: today() } }]),
    );
    wrapper.unmount();
  });
});

describe("SendToLabDialog order", () => {
  it("bills a lab job on an order line instead of a price", async () => {
    const lab = server.addLab({ name: "Lab A", scannerIds: [] });
    server.saveLabOrder("order", {
      labId: lab.id,
      code: "0510006",
      orderedAt: "2026-10-05T03:03:00Z",
      vat: 44800,
      items: [
        { id: "bw", product: "35mm B&W", quantity: 1, unitPrice: 125000 },
        { id: "colour", product: "35mm Colour", quantity: 3, unitPrice: 145000 },
      ],
    });
    const { wrapper } = await mountRescan();
    const select = (name: string) =>
      document.body.querySelector(`select[name='["${name}"]']`) as HTMLSelectElement;
    const choose = async (name: string, value: string) => {
      select(name).value = value;
      select(name).dispatchEvent(new Event("change"));
      await flushPromises();
    };
    await vi.waitFor(() => expect(select("labId").textContent).toContain("Lab A"));
    // at home there is no order to pick
    expect(select("orderItemId")).toBeNull();

    await choose("labId", lab.id);
    expect(select("orderItemId").textContent).toContain("#0510006 · 35mm Colour (0 of 3)");
    await choose("orderItemId", "colour");
    expect(document.body.textContent).toContain("Price from the order");
    expect(document.body.querySelector(`[name='["price"]']`)).toBeNull();

    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({ labId: lab.id, orderItemId: "colour" });
    expect(jobPut()!.price).toBeUndefined();
    wrapper.unmount();
  });

  it("keeps a job on its order line when it is edited, even a full one", async () => {
    const lab = server.addLab({ name: "Lab A", scannerIds: [] });
    server.saveLabOrder("order", {
      labId: lab.id,
      code: "0510006",
      orderedAt: "2026-10-05T03:03:00Z",
      items: [{ id: "bw", product: "35mm B&W", quantity: 1, unitPrice: 125000 }],
    });
    server.labOrders[0].items[0].jobs = [{ id: "job" }];
    const stock = server.addStock({ name: "Tri-X", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "at_lab" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (candidate) => candidate.roll.id === rec.id,
    )!;
    const wrapper = mount(SendToLabDialog, {
      attachTo: document.body,
      props: {
        open: false,
        row,
        job: {
          id: "job",
          labId: lab.id,
          labName: "Lab A",
          type: "develop",
          process: "BW",
          sentDate: "2026-10-05",
          scansExpectedDate: null,
          negativesExpectedDate: null,
          scansReceivedDate: null,
          negativesReturnedDate: null,
          price: 125000,
          order: { id: "order", code: "0510006", itemId: "bw", product: "35mm B&W" },
          notes: "",
          scanOrders: [],
          open: true,
        },
      },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await vi.waitFor(() => expect(document.body.textContent).toContain("Price from the order"));
    expect(document.body.querySelector(`[name='["price"]']`)).toBeNull();

    submit();
    await vi.waitFor(() => expect(jobPut()).toBeDefined());
    expect(jobPut()).toMatchObject({ orderItemId: "bw" });
    expect(jobPut()!.price).toBeUndefined();
    wrapper.unmount();
  });
});

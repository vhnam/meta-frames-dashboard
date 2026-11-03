// @vitest-environment happy-dom
import { rollQueries } from "../api";
import type { RollJob } from "../types";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import ProcessingJobs from "./ProcessingJobs.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

const job = (id: string, labName: string, sentDate: string): RollJob => ({
  id,
  labId: null,
  labName,
  type: "scan",
  process: "C-41",
  sentDate,
  scansExpectedDate: null,
  negativesExpectedDate: null,
  scansReceivedDate: sentDate,
  negativesReturnedDate: null,
  price: null,
  notes: "",
  scanOrders: [],
  open: false,
});

describe("ProcessingJobs", () => {
  it("lists the latest job first", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "scanned" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const wrapper = mount(ProcessingJobs, {
      props: {
        row,
        jobs: [
          job("first", "First lab", "2026-09-01"),
          job("latest", "Latest lab", "2026-10-10"),
          job("second", "Second lab", "2026-09-20"),
          // sent the same day as the second, but recorded after it
          job("third", "Third lab", "2026-09-20"),
        ],
      },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await flushPromises();
    const names = wrapper.findAll("header").map((header) => header.find("p").text());
    expect(names).toEqual(["Latest lab", "Third lab", "Second lab", "First lab"]);
    wrapper.unmount();
  });

  it("lists each step's expected and actual dates, with its status", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "at_lab" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const atLab: RollJob = {
      ...job("lab-job", "Saigon Film Lab", "2026-09-01"),
      labId: "lab-1",
      type: "develop_scan",
      price: 90000,
      scansReceivedDate: null,
      scansExpectedDate: "2026-09-05",
      negativesExpectedDate: "2026-09-04",
      negativesReturnedDate: "2026-09-06",
      scanOrders: [
        {
          scannerId: "d177cb3c-a850-4232-a4ca-75189b7b279b",
          scannerName: "Noritsu HS-1800",
          settings: { resolution: "hi_res" },
          scanCount: 0,
        },
      ],
      notes: "Push one stop",
      open: true,
    };
    const wrapper = mount(ProcessingJobs, {
      props: { row, jobs: [atLab] },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await vi.waitFor(() => expect(wrapper.text()).toContain("Hi-res"));
    expect(wrapper.find("header").text()).toContain("Develop + scan · C-41 · 90.000 ₫");
    const cells = (row: { findAll: (selector: string) => { text: () => string }[] }) =>
      row.findAll("th, td").map((cell) => cell.text().replace(/\s+/g, " "));
    const [head, ...rows] = wrapper.findAll("[aria-label=Dates] tr");
    expect(cells(head!)).toEqual(["Step", "Expected", "Actual", "Status"]);
    expect(rows.map(cells)).toEqual([
      ["Sent", "—", "01/09/2026", "Done"],
      ["Negatives back", "04/09/2026", "06/09/2026", "Done"],
      ["Scans back", "05/09/2026", "—", expect.stringMatching(/^Overdue \d+ days$/)],
    ]);
    expect(rows[2]!.findAll("td")[2]!.classes()).toContain("text-destructive");
    wrapper.unmount();
  });

  it("words home work as done by you", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "scanned" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const home: RollJob = {
      ...job("home-job", "Home", "2026-10-01"),
      type: "develop_scan",
      negativesReturnedDate: "2026-10-01",
    };
    const wrapper = mount(ProcessingJobs, {
      props: { row, jobs: [home] },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await flushPromises();
    const rows = wrapper
      .findAll("[aria-label=Dates] tbody tr")
      .map((row) => row.findAll("th, td").map((cell) => cell.text()));
    // home work has no due dates: only when it was done
    expect(rows).toEqual([
      ["Started", "—", "01/10/2026", "Done"],
      ["Negatives", "—", "01/10/2026", "Done"],
      ["Scans", "—", "01/10/2026", "Done"],
    ]);
    expect(wrapper.find("[aria-label=Scans]").exists()).toBe(false);
    wrapper.unmount();
  });

  it("keeps an empty lab job's columns with a dash for each date not set", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "at_lab" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (row) => row.roll.id === rec.id,
    )!;
    const fresh: RollJob = {
      ...job("fresh", "Saigon Film Lab", "2026-10-01"),
      labId: "lab-1",
      type: "develop",
      scansReceivedDate: null,
      open: true,
    };
    const wrapper = mount(ProcessingJobs, {
      props: { row, jobs: [fresh] },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await flushPromises();
    const rows = wrapper
      .findAll("[aria-label=Dates] tbody tr")
      .map((row) => row.findAll("th, td").map((cell) => cell.text()));
    expect(rows).toEqual([
      ["Sent", "—", "01/10/2026", "Done"],
      ["Negatives back", "—", "—", "Waiting"],
    ]);
    wrapper.unmount();
  });
});

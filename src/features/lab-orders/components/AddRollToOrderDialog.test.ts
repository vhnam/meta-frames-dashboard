// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { SelectStub } from "#/test/selectStub";
import { labOrderQueries, saveLabOrder } from "../api";
import AddRollToOrderDialog from "./AddRollToOrderDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const plugins = [[VueQueryPlugin, { queryClient }]] as never;

const openDialog = async (lineId?: string) => {
  const lab = server.addLab({ name: "Lab A", scannerIds: [] });
  const id = await saveLabOrder({
    input: {
      labId: lab.id,
      code: "0510006",
      orderedAt: "2026-10-05T03:03:00.000Z",
      lines: [
        { id: "bw", product: "35mm B&W", options: "", quantity: 1, unitPrice: 125000 },
        { id: "colour", product: "35mm Colour", options: "", quantity: 3, unitPrice: 145000 },
      ],
    },
  });
  const order = await queryClient.fetchQuery(labOrderQueries.detail(id));
  const wrapper = mount(AddRollToOrderDialog, {
    attachTo: document.body,
    props: { open: false, order, lineId },
    global: { plugins },
  });
  await wrapper.setProps({ open: true } as never);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("AddRollToOrderDialog", () => {
  it("names the order and starts on the line it was opened from", async () => {
    server.linkableJobs = [
      {
        id: "job",
        rollId: "roll",
        type: "develop",
        sentAt: "2026-10-05",
        stockName: "Kodak Gold",
        format: 135,
        exposures: 36,
      },
    ];
    const wrapper = await openDialog("colour");
    await vi.waitFor(() => expect(document.body.textContent).toContain("#0510006"));
    const text = (document.body.textContent ?? "").replace(/\s+/g, " ");
    expect(text).toContain("Roll & line");
    expect(text).toContain("Select a roll");
    expect(text).toContain("35mm Colour (0 of 3)");
    expect(text).toContain("Add roll");
    wrapper.unmount();
  });

  it("only offers Close when no roll is waiting", async () => {
    const wrapper = await openDialog();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("No roll is waiting for an order."),
    );
    const buttons = [...document.body.querySelectorAll("button")].map((button) =>
      button.textContent?.trim(),
    );
    expect(buttons).toContain("Close");
    expect(buttons).not.toContain("Add roll");
    wrapper.unmount();
  });

  it("puts one roll on two lines, keeping the line it already has", async () => {
    server.linkableJobs = [
      {
        id: "job",
        rollId: "roll",
        type: "develop_scan",
        sentAt: "2026-10-05",
        stockName: "Kodak Gold",
        format: 135,
        exposures: 36,
        orderItemIds: ["bw"],
      },
    ];
    const lab = server.addLab({ name: "Lab B", scannerIds: [] });
    const id = await saveLabOrder({
      input: {
        labId: lab.id,
        code: "2",
        orderedAt: "2026-10-05T03:03:00.000Z",
        lines: [
          { id: "bw", product: "Develop", options: "", quantity: 1, unitPrice: 60000 },
          { id: "colour", product: "Scan", options: "", quantity: 1, unitPrice: 40000 },
        ],
      },
    });
    server.labOrders[0].items[0].jobs = [{ id: "job", rollId: "roll" }];
    const order = await queryClient.fetchQuery(labOrderQueries.detail(id));
    const wrapper = mount(AddRollToOrderDialog, {
      attachTo: document.body,
      props: { open: false, order, lineId: "colour" },
      global: { plugins, stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    const select = () =>
      document.body.querySelector(`select[name='["jobId"]']`) as HTMLSelectElement;
    const tickBox = (product: string) =>
      document.body.querySelector(
        `[aria-label="Bill this roll on ${product}"]`,
      ) as HTMLButtonElement;
    await vi.waitFor(() => expect(select().textContent).toContain("Kodak Gold"));
    expect(tickBox("Scan").getAttribute("aria-checked")).toBe("true");

    select().value = "job";
    select().dispatchEvent(new Event("change"));
    await flushPromises();
    // full, but the roll is on it: it stays ticked and can be taken off
    expect(tickBox("Develop").getAttribute("aria-checked")).toBe("true");
    expect(tickBox("Develop").disabled).toBe(false);

    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() =>
      expect(server.requests.find((request) => request.url.endsWith("/order-items"))?.body).toEqual(
        {
          orderItemIds: ["bw", "colour"],
        },
      ),
    );
    wrapper.unmount();
  });
});

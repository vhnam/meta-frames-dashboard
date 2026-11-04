// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { labOrderQueries, saveLabOrder } from "./api";
import { rollsOnOrder, roomOnLine } from "./types";
import LabOrderFormDialog from "./components/LabOrderFormDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const plugins = [[VueQueryPlugin, { queryClient }]] as never;
const lines = [
  { id: "bw", product: "35mm B&W", options: "", quantity: 1, unitPrice: 125000 },
  { id: "colour", product: "35mm Colour", options: "Dev + Scan", quantity: 3, unitPrice: 145000 },
];

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("Lab orders", () => {
  it("sends an order's lines and reads back its amounts", async () => {
    const lab = server.addLab({ name: "Lab A", scannerIds: [] });
    const id = await saveLabOrder({
      input: {
        labId: lab.id,
        code: " #0510006 ",
        orderedAt: "2026-10-05T03:03:00.000Z",
        dueDate: "2026-10-20",
        vat: 44800,
        lines,
      },
    });
    const body = server.requests.find((request) => request.method === "put")?.body as {
      code: string;
      discount: number;
      items: { options?: string }[];
    };
    expect(body.code).toBe("0510006");
    expect(body.discount).toBe(0);
    expect(body.items[0].options).toBeUndefined();

    const order = await queryClient.fetchQuery(labOrderQueries.detail(id));
    expect(order.labName).toBe("Lab A");
    expect(order.subtotal).toBe(560000);
    expect(order.total).toBe(604800);
    expect(order.lines.map((line) => line.unitCost)).toEqual([135000, 156600]);
    expect(rollsOnOrder(order)).toEqual({ rolls: 0, taken: 0, billed: 4 });
    expect(roomOnLine(order.lines[1])).toBe(3);
  });

  it("keeps a line with rolls from being removed in the form", async () => {
    const lab = server.addLab({ name: "Lab A", scannerIds: [] });
    const id = await saveLabOrder({
      input: { labId: lab.id, code: "1", orderedAt: "2026-10-05T03:03:00.000Z", lines },
    });
    server.labOrders[0].items[1] = {
      ...server.labOrders[0].items[1],
      jobs: [
        {
          id: "job",
          rollId: "roll",
          type: "develop",
          sentAt: "2026-10-05",
          stockName: "Kodak Gold",
          format: 135,
          exposures: 36,
        },
      ],
    };
    const order = await queryClient.fetchQuery(labOrderQueries.detail(id));
    const wrapper = mount(LabOrderFormDialog, {
      attachTo: document.body,
      props: { open: false, order },
      global: { plugins },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const removeButton = (index: number) =>
      document.body.querySelector(`[aria-label="Remove line ${index}"]`) as HTMLButtonElement;
    expect(removeButton(1).disabled).toBe(false);
    expect(removeButton(2).disabled).toBe(true);
    wrapper.unmount();
  });
});

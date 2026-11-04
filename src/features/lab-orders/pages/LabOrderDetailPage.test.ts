// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { saveLabOrder } from "../api";
import LabOrderDetailPage from "./LabOrderDetailPage.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@tanstack/vue-router", async (original) => ({
  ...(await original<typeof import("@tanstack/vue-router")>()),
  useRouter: () => ({ navigate: vi.fn() }),
}));

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = (orderId: string) =>
  mount(LabOrderDetailPage, {
    props: { orderId },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });

const saveOrder = () => {
  const lab = server.addLab({ name: "Lab A", scannerIds: [] });
  return saveLabOrder({
    input: {
      labId: lab.id,
      code: "0510006",
      orderedAt: "2026-10-05T03:03:00.000Z",
      lines: [
        { id: "bw", product: "35mm B&W", options: "", quantity: 1, unitPrice: 125000 },
        {
          id: "colour",
          product: "35mm Colour",
          options: "**Dev** + Scan",
          quantity: 3,
          unitPrice: 145000,
        },
      ],
    },
  });
};

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("LabOrderDetailPage", () => {
  it("shows the order's stats and lists a roll once with each line that bills it", async () => {
    const orderId = await saveOrder();
    const job = {
      id: "job",
      rollId: "roll",
      type: "develop",
      sentAt: "2026-10-05",
      stockName: "Kodak Gold",
      format: 135,
      exposures: 36,
    };
    server.labOrders[0].items = server.labOrders[0].items.map((item) => ({
      ...item,
      jobs: [job],
    }));

    const wrapper = render(orderId);
    await vi.waitFor(() => expect(wrapper.find("h1").text()).toBe("#0510006"));
    const text = wrapper.text().replace(/\s+/g, " ");
    expect(text).toContain("Lab: Lab A");
    expect(text).toContain("Order lines (2)");
    expect(text).toContain("Rolls (1)");
    expect(text).toContain("Kodak Gold");
    expect(text).toMatch(/135 · 36 exp · .+ Sent 05\/10\/2026/);
    const billedOn = wrapper.findAll("li li").map((line) => line.text());
    expect(billedOn).toEqual(["35mm B&W", "35mm Colour"]);
    expect(text).toContain("No notes yet.");
    const stats = Object.fromEntries(
      wrapper
        .find("dl")
        .findAll("dt")
        .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()]),
    );
    expect(stats).toMatchObject({ Due: "—", Rolls: "1" });
    expect(wrapper.find('[aria-label="Take Kodak Gold off this order"]').exists()).toBe(true);
    await vi.waitFor(() => expect(wrapper.find(".rich-text strong").text()).toBe("Dev"));
  });

  it("says when an order has no rolls", async () => {
    const wrapper = render(await saveOrder());
    await vi.waitFor(() => expect(wrapper.text()).toContain("No rolls on this order yet."));
  });
});

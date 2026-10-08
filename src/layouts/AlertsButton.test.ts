// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { queryClient } from "#/shared/api/client";
import { TooltipProvider } from "#/shared/ui/tooltip";
import { installFakeServer, server } from "#/test/fakeServer";
import AlertsButton from "./AlertsButton.vue";

installFakeServer();

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = () =>
  mount(
    defineComponent(() => () => h(TooltipProvider, { delayDuration: 0 }, () => h(AlertsButton))),
    {
      attachTo: document.body,
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
    },
  );

const tooltip = () => document.body.querySelector('[data-slot="tooltip-content"]');
const panel = () => document.body.querySelector('[data-slot="dropdown-menu-content"]');

beforeEach(() => {
  server.reset();
  queryClient.clear();
  document.body.innerHTML = "";
});

describe("AlertsButton", () => {
  it("shows the count and lists the rolls in the panel", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    server.addRoll({ filmStockId: stock.id, expiry: { year: 2020, month: 1 } });
    const w = render();
    const bell = () => w.find("button");
    await vi.waitFor(() => expect(bell().text()).toBe("1"));

    await bell().trigger("focus");
    await vi.waitFor(() => expect(tooltip()?.textContent).toContain("Alerts · 1 roll"));

    await bell().trigger("keydown", { key: "Enter" });
    await vi.waitFor(() => expect(panel()?.textContent).toContain("UltraMax"));
    expect(panel()?.textContent).toMatch(/Expired .* ago/);
    // anchored to the bell: an unanchored panel stays parked off-screen at translate(0, -200%)
    const wrapper = document.body.querySelector<HTMLElement>("[data-reka-popper-content-wrapper]");
    await vi.waitFor(() => expect(wrapper?.style.transform).not.toContain("-200%"));
    // the tooltip shuts while the panel is open
    expect(tooltip()).toBeNull();
  });
});

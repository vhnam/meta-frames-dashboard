// @vitest-environment happy-dom
import { rollQueries, updateRoll } from "../api";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import RollEditDialog from "./RollEditDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("RollEditDialog", () => {
  it("saves changed exposures through PUT /rolls/{id}", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    const rec = server.addRoll({ filmStockId: stock.id, exposures: 36 });
    const [{ data: row }] = [
      {
        data: (await queryClient.fetchQuery(rollQueries.list({}))).find(
          (row) => row.roll.id === rec.id,
        )!,
      },
    ];
    const wrapper = mount(RollEditDialog, {
      attachTo: document.body,
      props: { open: false, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const exposures = [...document.body.querySelectorAll("input")].find(
      (input) => input.value === "36",
    )!;
    exposures.value = "24";
    exposures.dispatchEvent(new Event("input", { bubbles: true }));
    const year = document.body.querySelector('input[placeholder="e.g. 2027"]') as HTMLInputElement;
    year.value = "2028";
    year.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    // the API reads a nested expiry object and ignores flat expiryYear / expiryMonth
    const put = server.requests.find((request) => request.method === "put")!.body as Record<
      string,
      unknown
    >;
    expect(put).toMatchObject({ expiry: { year: 2028 } });
    expect(Object.keys(put).sort((left, right) => left.localeCompare(right))).toEqual([
      "expiry",
      "exposures",
      "filmStockId",
      "format",
    ]);
    expect(server.rolls[0].expiry).toEqual({ year: 2028, month: undefined });
    wrapper.unmount();
  });

  async function openOn(rollId: string) {
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (candidate) => candidate.roll.id === rollId,
    )!;
    const wrapper = mount(RollEditDialog, {
      attachTo: document.body,
      props: { open: false, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    return wrapper;
  }

  const exposuresInput = () =>
    document.body.querySelector('input[placeholder="e.g. 36"]') as HTMLInputElement;
  const typeExposures = async (value: string) => {
    exposuresInput().value = value;
    exposuresInput().dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
  };
  const save = async () => {
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await flushPromises();
  };
  const clickButton = async (text: string) => {
    [...document.body.querySelectorAll("button")]
      .find((button) => button.textContent?.trim() === text)!
      .click();
    await flushPromises();
  };
  const puts = () => server.requests.filter((request) => request.method === "put");

  it("sends the version it loaded as If-Match", async () => {
    const rec = server.addRoll({ version: 4 });
    const wrapper = await openOn(rec.id);
    await typeExposures("24");
    await save();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    expect(puts()[0].headers["If-Match"]).toBe('"4"');
    wrapper.unmount();
  });

  it("keeps the user's edits on 412 and saves them over the latest roll only when asked", async () => {
    const rec = server.addRoll({ exposures: 36, version: 2 });
    const wrapper = await openOn(rec.id);
    // a phone saves a note while the form is open
    Object.assign(server.rolls[0], { description: "from the phone", version: 3 });

    await typeExposures("24");
    await save();
    await vi.waitFor(() => expect(document.body.querySelector("[role=alert]")).not.toBeNull());
    expect(server.rolls[0]).toMatchObject({ exposures: 36, description: "from the phone" });
    expect(exposuresInput().value).toBe("24");
    expect(puts()).toHaveLength(1);
    // no retry while the user has not chosen
    await save();
    expect(puts()).toHaveLength(1);

    await clickButton("Keep my edits");
    expect(exposuresInput().value).toBe("24");
    await save();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    expect(puts()).toHaveLength(2);
    expect(puts()[1].headers["If-Match"]).toBe('"3"');
    expect(server.rolls[0].description).toBe("from the phone");
    wrapper.unmount();
  });

  it("sends no If-Match when the server reported no version", async () => {
    const rec = server.addRoll();
    const row = (await queryClient.fetchQuery(rollQueries.list({})))[0];
    await updateRoll({
      row: { ...row, roll: { ...row.roll, version: null } },
      input: {
        stockId: rec.filmStockId,
        format: "135",
        exposures: 24,
        price: null,
        expiryYear: null,
        expiryMonth: null,
      },
    });
    expect(puts()[0].headers).not.toHaveProperty("If-Match");
  });

  it("can drop the user's edits for the latest values instead", async () => {
    const rec = server.addRoll({ exposures: 36, version: 0 });
    const wrapper = await openOn(rec.id);
    Object.assign(server.rolls[0], { exposures: 12, version: 1 });

    await typeExposures("24");
    await save();
    await vi.waitFor(() => expect(document.body.querySelector("[role=alert]")).not.toBeNull());
    await clickButton("Use the current values");
    expect(exposuresInput().value).toBe("12");
    expect(server.rolls[0].exposures).toBe(12);
    expect(puts()).toHaveLength(1);
    wrapper.unmount();
  });
});

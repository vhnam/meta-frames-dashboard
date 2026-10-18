// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { defineComponent, h, ref } from "vue";
import CreatableCombobox from "./CreatableCombobox.vue";

const value = ref("");
const render = (start = "") => {
  value.value = start;
  return mount(
    defineComponent(
      () => () =>
        h(CreatableCombobox, {
          options: [{ value: "Leica M", count: 2 }, { value: "Nikon F" }],
          noun: "mount",
          modelValue: value.value,
          "onUpdate:modelValue": (next: string) => (value.value = next),
        }),
    ),
    { attachTo: document.body },
  );
};
const items = () => [...document.body.querySelectorAll('[role="option"]')] as HTMLElement[];

afterEach(() => {
  document.body.innerHTML = "";
});

describe("CreatableCombobox", () => {
  it("lists the known values and picks one", async () => {
    const wrapper = render();
    await wrapper.find("button").trigger("click");
    await flushPromises();
    const label = (element: HTMLElement) => element.querySelector("span")?.textContent?.trim();
    expect(items().map(label)).toEqual(["Leica M", "Nikon F"]);
    expect(items()[0]!.querySelector("[aria-label]")?.getAttribute("aria-label")).toBe("used by 2");
    items()[1]!.click();
    await flushPromises();
    expect(value.value).toBe("Nikon F");
    wrapper.unmount();
  });

  it("offers to add a value that is not in the list", async () => {
    const wrapper = render();
    const input = wrapper.find("input");
    await input.setValue("L39");
    await flushPromises();
    const add = items().find((element) => element.textContent?.includes("Add mount"));
    expect(add?.textContent).toContain("“L39”");
    add!.click();
    await flushPromises();
    expect(value.value).toBe("L39");
    wrapper.unmount();
  });

  it("filters as you type, ignoring case, and offers no add for a known value", async () => {
    const wrapper = render();
    await wrapper.find("input").setValue("nikon f");
    await flushPromises();
    expect(items().map((element) => element.textContent?.trim())).toEqual(["Nikon F"]);
    wrapper.unmount();
  });

  it("keeps typed text when the field is left without picking", async () => {
    const wrapper = render("Nikon F");
    const input = wrapper.find("input");
    await input.setValue("M42");
    await input.trigger("blur");
    expect(value.value).toBe("M42");
    wrapper.unmount();
  });
});

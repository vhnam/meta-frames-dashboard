// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import Select from "./Select.vue";

const options = [{ value: "bw", label: "B&W" }];

describe("Select", () => {
  it("shows the placeholder when nothing is selected", () => {
    const w = mount(Select, { props: { modelValue: "", placeholder: "All types", options } });
    expect(w.text()).toContain("All types");
  });

  it("shows the placeholder for required fields without offering an empty item", () => {
    const w = mount(Select, {
      props: { modelValue: "", placeholder: "Select type", allowEmpty: false, options },
    });
    expect(w.text()).toContain("Select type");
  });

  it("shows the option label, not the value", () => {
    const w = mount(Select, { props: { modelValue: "bw", placeholder: "All types", options } });
    expect(w.text()).toContain("B&W");
    expect(w.text()).not.toContain("bw");
  });
});

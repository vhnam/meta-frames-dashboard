// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import Select from "./Select.vue";

const options = [{ value: "bw", label: "B&W" }];

describe("Select", () => {
  it("shows the placeholder when nothing is selected", () => {
    const wrapper = mount(Select, { props: { modelValue: "", placeholder: "All types", options } });
    expect(wrapper.text()).toContain("All types");
  });

  it("shows the placeholder for required fields without offering an empty item", () => {
    const wrapper = mount(Select, {
      props: { modelValue: "", placeholder: "Select type", allowEmpty: false, options },
    });
    expect(wrapper.text()).toContain("Select type");
  });

  it("shows the option label, not the value", () => {
    const wrapper = mount(Select, {
      props: { modelValue: "bw", placeholder: "All types", options },
    });
    expect(wrapper.text()).toContain("B&W");
    expect(wrapper.text()).not.toContain("bw");
  });
});

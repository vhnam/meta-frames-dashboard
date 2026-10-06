// @vitest-environment happy-dom
import { Form, useForm } from "@formisch/vue";
import { mount } from "@vue/test-utils";
import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";
import { defineComponent, h, nextTick } from "vue";
import FormInput from "./FormInput.vue";

const FormSchema = v.object({
  stockId: v.string(),
  format: v.string(),
  exposures: v.number(),
  quantity: v.pipe(v.number("Enter a number."), v.minValue(1, "Quantity must be at least 1.")),
  price: v.optional(v.pipe(v.number("Enter a number."), v.minValue(0, "Price must be 0 or more."))),
});

function setup(onSubmit: (o: unknown) => void) {
  const Comp = defineComponent({
    setup() {
      const form = useForm({
        schema: FormSchema,
        initialInput: { stockId: "s1", format: "135", exposures: 36, quantity: 1 },
      });
      return () =>
        h(Form, { of: form, onSubmit }, () => [
          h(FormInput, { of: form, path: ["quantity"], label: "Quantity", type: "number" }),
          h(FormInput, {
            of: form,
            path: ["price"],
            label: "Price",
            type: "number",
            optional: true,
          }),
        ]);
    },
  });
  return mount(Comp, { attachTo: document.body });
}
const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  await nextTick();
};

describe("FormInput + Formisch", () => {
  it("shows (optional) in emphasis and submits decoded numbers", async () => {
    let out: unknown;
    const w = setup((o) => (out = o));
    expect(w.find("em").text()).toBe("(optional)");
    const [qty] = w.findAll("input");
    await qty.setValue("3");
    await w.find("form").trigger("submit");
    await flush();
    expect(out).toMatchObject({ stockId: "s1", quantity: 3 });
  });

  it("shows validation error and blocks submit", async () => {
    let out: unknown;
    const w = setup((o) => (out = o));
    await w.findAll("input")[0].setValue("0");
    await w.find("form").trigger("submit");
    await flush();
    expect(out).toBeUndefined();
    expect(w.text()).toContain("Quantity must be at least 1.");
  });
});

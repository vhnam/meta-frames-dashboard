import { defineComponent, h } from "vue";

/** Native stand-in for the reka-ui based Select, whose popup does not work under happy-dom. */
export const SelectStub = defineComponent({
  name: "Select",
  props: {
    modelValue: { type: String, default: "" },
    options: { type: Array as () => { value: string; label: string }[], default: () => [] },
    placeholder: { type: String, default: undefined },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "select",
        {
          ...attrs,
          value: props.modelValue,
          onChange: (e: Event) => emit("update:modelValue", (e.target as HTMLSelectElement).value),
        },
        [
          props.placeholder !== undefined ? h("option", { value: "" }, props.placeholder) : null,
          ...props.options.map((o) => h("option", { value: o.value }, o.label)),
        ],
      );
  },
});

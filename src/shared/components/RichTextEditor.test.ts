// @vitest-environment happy-dom
import type { Editor } from "@tiptap/vue-3";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { defineComponent, h, ref } from "vue";
import RichText from "./RichText.vue";
import RichTextEditor from "./RichTextEditor.vue";

/** The editor bound with v-model to `notes`, as a form would bind it. */
const notes = ref("");
const editorOf = async (value: string) => {
  notes.value = value;
  const w = mount(
    defineComponent(
      () => () =>
        h(RichTextEditor, {
          modelValue: notes.value,
          "onUpdate:modelValue": (x: string) => (notes.value = x),
        }),
    ),
    { attachTo: document.body },
  );
  await flushPromises();
  return w;
};

describe("RichTextEditor", () => {
  it("shows Markdown as formatted text", async () => {
    const w = await editorOf("Push **one stop**\n\n- fine grain\n- warm");
    expect(w.find("strong").text()).toBe("one stop");
    expect(w.findAll("li")).toHaveLength(2);
    w.unmount();
  });

  it("writes formatting back as Markdown", async () => {
    const w = await editorOf("grain");
    // select all, then bold it from the toolbar
    const editor = w.findComponent({ name: "EditorContent" }).props("editor") as Editor;
    editor.commands.selectAll();
    await w.find('button[aria-label="Bold"]').trigger("click");
    await flushPromises();
    expect(notes.value).toBe("**grain**");
    expect(w.find('button[aria-label="Bold"]').attributes("aria-pressed")).toBe("true");
    w.unmount();
  });

  it("takes outside changes, e.g. a form reset", async () => {
    const w = await editorOf("old notes");
    notes.value = "## New";
    await flushPromises();
    expect(w.find("h2").text()).toBe("New");
    notes.value = "";
    await flushPromises();
    expect(w.text()).not.toContain("New");
    w.unmount();
  });

  it("keeps plain-text notes as they are", async () => {
    const w = await editorOf("Rated at 320.");
    expect(w.find("p").text()).toBe("Rated at 320.");
    w.unmount();
  });
});

describe("RichText", () => {
  it("renders Markdown read-only", async () => {
    const w = mount(RichText, { props: { markdown: "*soft* highlights" } });
    await flushPromises();
    expect(w.find("em").text()).toBe("soft");
    expect(w.find('[contenteditable="true"]').exists()).toBe(false);
    w.unmount();
  });
});

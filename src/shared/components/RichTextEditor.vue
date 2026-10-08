<script setup lang="ts">
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconCode,
  IconH2,
  IconH3,
  IconItalic,
  IconList,
  IconListNumbers,
  IconStrikethrough,
} from "@tabler/icons-vue";
import { type Component, watch } from "vue";
import { cn } from "#/shared/lib/utils";

/** A WYSIWYG editor that reads and writes Markdown, so plain-text notes stay valid. */
const props = defineProps<{ placeholder?: string; disabled?: boolean; id?: string }>();
const model = defineModel<string>({ default: "" });

const editor = useEditor({
  content: model.value,
  contentType: "markdown",
  editable: !props.disabled,
  extensions: [
    // Underline has no Markdown syntax; links are kept but open only from the detail page.
    StarterKit.configure({ underline: false, link: { openOnClick: false } }),
    Markdown,
    Placeholder.configure({ placeholder: () => props.placeholder ?? "" }),
  ],
  editorProps: {
    attributes: {
      ...(props.id ? { id: props.id } : {}),
      "data-slot": "rich-text-input",
      class: "rich-text font-heading min-h-24 px-3.5 py-2.5 leading-relaxed outline-none",
    },
  },
  onUpdate: ({ editor }) => {
    model.value = editor.isEmpty ? "" : editor.getMarkdown();
  },
});

// Outside changes (a form reset) replace the content; our own updates are skipped.
watch(model, (value) => {
  const e = editor.value;
  if (!e || value === (e.isEmpty ? "" : e.getMarkdown())) return;
  e.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
});
watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled),
);

interface Tool {
  label: string;
  icon: Component;
  run: () => void;
  active?: () => boolean;
  enabled?: () => boolean;
}

const chain = () => editor.value!.chain().focus();
const groups: Tool[][] = [
  [
    {
      label: "Bold",
      icon: IconBold,
      run: () => chain().toggleBold().run(),
      active: () => editor.value!.isActive("bold"),
    },
    {
      label: "Italic",
      icon: IconItalic,
      run: () => chain().toggleItalic().run(),
      active: () => editor.value!.isActive("italic"),
    },
    {
      label: "Strikethrough",
      icon: IconStrikethrough,
      run: () => chain().toggleStrike().run(),
      active: () => editor.value!.isActive("strike"),
    },
    {
      label: "Inline code",
      icon: IconCode,
      run: () => chain().toggleCode().run(),
      active: () => editor.value!.isActive("code"),
    },
  ],
  [
    {
      label: "Heading",
      icon: IconH2,
      run: () => chain().toggleHeading({ level: 2 }).run(),
      active: () => editor.value!.isActive("heading", { level: 2 }),
    },
    {
      label: "Subheading",
      icon: IconH3,
      run: () => chain().toggleHeading({ level: 3 }).run(),
      active: () => editor.value!.isActive("heading", { level: 3 }),
    },
    {
      label: "Bulleted list",
      icon: IconList,
      run: () => chain().toggleBulletList().run(),
      active: () => editor.value!.isActive("bulletList"),
    },
    {
      label: "Numbered list",
      icon: IconListNumbers,
      run: () => chain().toggleOrderedList().run(),
      active: () => editor.value!.isActive("orderedList"),
    },
    {
      label: "Quote",
      icon: IconBlockquote,
      run: () => chain().toggleBlockquote().run(),
      active: () => editor.value!.isActive("blockquote"),
    },
  ],
  [
    {
      label: "Undo",
      icon: IconArrowBackUp,
      run: () => chain().undo().run(),
      enabled: () => editor.value!.can().undo(),
    },
    {
      label: "Redo",
      icon: IconArrowForwardUp,
      run: () => chain().redo().run(),
      enabled: () => editor.value!.can().redo(),
    },
  ],
];
</script>

<template>
  <div
    data-slot="rich-text"
    :data-disabled="disabled || undefined"
    class="border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 overflow-hidden rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] focus-within:ring-3 data-[disabled]:opacity-50"
  >
    <div
      v-if="editor && !disabled"
      class="bg-secondary/60 flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1"
      role="toolbar"
      aria-label="Formatting"
    >
      <template v-for="(group, i) in groups" :key="i">
        <span v-if="i" class="bg-border mx-1 h-5 w-px" aria-hidden="true" />
        <button
          v-for="tool in group"
          :key="tool.label"
          type="button"
          :title="tool.label"
          :aria-label="tool.label"
          :aria-pressed="tool.active ? tool.active() : undefined"
          :disabled="tool.enabled ? !tool.enabled() : false"
          :class="
            cn(
              'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-sm outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-40',
              tool.active?.() &&
                'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
            )
          "
          @click="tool.run()"
        >
          <component :is="tool.icon" class="size-4" aria-hidden="true" />
        </button>
      </template>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

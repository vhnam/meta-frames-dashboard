<script setup lang="ts">
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { watch } from "vue";

/** Read-only view of Markdown written with RichTextEditor. Plain text shows as paragraphs. */
const props = defineProps<{ markdown: string }>();

const editor = useEditor({
  content: props.markdown,
  contentType: "markdown",
  editable: false,
  extensions: [StarterKit.configure({ underline: false, link: { openOnClick: true } }), Markdown],
  editorProps: { attributes: { class: "rich-text outline-none" } },
});

watch(
  () => props.markdown,
  (value) => editor.value?.commands.setContent(value, { contentType: "markdown" }),
);
</script>

<template>
  <EditorContent :editor="editor" />
</template>

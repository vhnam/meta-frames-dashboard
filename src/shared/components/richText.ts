import { defineAsyncComponent } from "vue";

// TipTap is large: the read-only notes view loads only where notes are shown.
export const RichText = defineAsyncComponent(() => import("./RichText.vue"));

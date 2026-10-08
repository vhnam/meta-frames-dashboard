<script setup lang="ts" generic="TSchema extends FormSchema">
import { Form } from "@formisch/vue";
import type { FormSchema, FormStore } from "@formisch/vue";
import { IconX } from "@tabler/icons-vue";
import type * as v from "valibot";
import { Button } from "#/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/shared/ui/dialog";
import { cn } from "#/shared/lib/utils";

/**
 * A larger form dialog for records with several groups of fields: a header, numbered
 * `FormSection`s that scroll, and Cancel / Save fixed at the bottom.
 */
withDefaults(
  defineProps<{
    form: FormStore<TSchema>;
    title: string;
    description: string;
    submitLabel?: string;
    /** Disables Save while the request runs. */
    pending?: boolean;
    size?: "md" | "lg";
  }>(),
  { submitLabel: "Save", size: "lg" },
);
const emit = defineEmits<{ submit: [output: v.InferOutput<TSchema>] }>();
const open = defineModel<boolean>("open", { required: true });

/** Roomier controls in the sans heading face, as on the auth pages, on white so they stand
 * out from the paper background. */
const FIELDS = [
  "[&_[data-slot=label]]:font-heading",
  "[&_:is([data-slot=input],[data-slot=select-trigger],[data-slot=rich-text])]:bg-white",
  "dark:[&_:is([data-slot=input],[data-slot=select-trigger],[data-slot=rich-text])]:bg-input/30",
  "[&_[data-slot=input]]:font-heading [&_[data-slot=input]]:h-11 [&_[data-slot=input]]:text-base!",
  "[&_[data-slot=select-trigger]]:font-heading [&_[data-slot=select-trigger]]:h-11! [&_[data-slot=select-trigger]]:text-base",
].join(" ");
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      :class="
        cn(
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-2xl',
        )
      "
    >
      <div class="bg-card flex items-start justify-between gap-4 border-b px-6 py-6 sm:px-9">
        <div class="grid gap-2">
          <DialogTitle class="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {{ title }}
          </DialogTitle>
          <DialogDescription class="text-muted-foreground text-sm">
            {{ description }}
          </DialogDescription>
        </div>
        <DialogClose
          class="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -mr-1 rounded-md p-1 outline-none focus-visible:ring-3"
        >
          <IconX class="size-6" aria-hidden="true" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </div>

      <Form
        :of="form"
        class="flex min-h-0 flex-1 flex-col"
        @submit="(output) => emit('submit', output)"
      >
        <div :class="FIELDS" class="grid min-h-0 flex-1 gap-9 overflow-y-auto px-6 py-7 sm:px-9">
          <slot />
        </div>

        <div class="bg-card flex items-center gap-3 border-t px-6 py-4 sm:px-9">
          <!-- left side of the footer, e.g. Delete when editing -->
          <slot name="footer-start" />
          <div class="ml-auto flex gap-3">
            <Button type="button" variant="outline" @click="open = false">Cancel</Button>
            <Button type="submit" :disabled="pending">{{ submitLabel }}</Button>
          </div>
        </div>
      </Form>

      <!-- dialogs opened from this one stay inside it, so focus and outside clicks behave -->
      <slot name="dialogs" />
    </DialogContent>
  </Dialog>
</template>

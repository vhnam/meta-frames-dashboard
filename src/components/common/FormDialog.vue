<script setup lang="ts" generic="TSchema extends FormSchema">
import { Form } from "@formisch/vue";
import type { FormSchema, FormStore } from "@formisch/vue";
import type * as v from "valibot";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";

defineProps<{
  form: FormStore<TSchema>;
  title: string;
  description?: string;
  submitLabel?: string;
  wide?: boolean;
}>();
const emit = defineEmits<{ submit: [output: v.InferOutput<TSchema>] }>();
const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :class="wide ? 'max-h-[90vh] overflow-y-auto sm:max-w-2xl' : 'max-h-[90vh] overflow-y-auto'"
    >
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <!-- Radix requires a description for screen readers; hide it when none is given -->
        <DialogDescription :class="description ? undefined : 'sr-only'">
          {{ description ?? title }}
        </DialogDescription>
      </DialogHeader>
      <Form :of="form" class="grid gap-4" @submit="(output) => emit('submit', output)">
        <slot />
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit">{{ submitLabel ?? "Save" }}</Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  </Dialog>
</template>

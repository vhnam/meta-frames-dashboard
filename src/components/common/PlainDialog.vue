<script setup lang="ts">
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";

defineProps<{ title: string; description?: string; submitLabel?: string; wide?: boolean }>();
const emit = defineEmits<{ submit: [] }>();
const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :class="wide ? 'max-h-[90vh] overflow-y-auto sm:max-w-3xl' : 'max-h-[90vh] overflow-y-auto'"
    >
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <!-- Radix requires a description for screen readers; hide it when none is given -->
        <DialogDescription :class="description ? undefined : 'sr-only'">
          {{ description ?? title }}
        </DialogDescription>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="emit('submit')">
        <slot />
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit">{{ submitLabel ?? "Save" }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

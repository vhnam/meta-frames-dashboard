<script setup lang="ts">
import { IconTrash } from "@tabler/icons-vue";
import { computed, ref, watch } from "vue";
import { pendingAsk } from "#/shared/lib/ui";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "#/shared/ui/alert-dialog";
import { Button } from "#/shared/ui/button";

// keeps the title while the dialog animates out
const message = ref("");
watch(pendingAsk, (p) => p && (message.value = p.message));

function settle(ok: boolean) {
  pendingAsk.value?.resolve(ok);
  pendingAsk.value = undefined;
}

// Cancel, Escape and the overlay close through here
const open = computed({
  get: () => !!pendingAsk.value,
  set: (o) => o || settle(false),
});
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia class="bg-destructive/10 text-destructive">
          <IconTrash aria-hidden="true" />
        </AlertDialogMedia>
        <AlertDialogTitle>{{ message }}</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <!-- a plain Button: AlertDialogAction closes the dialog before its own @click runs -->
        <Button variant="destructive" @click="settle(true)">Delete</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

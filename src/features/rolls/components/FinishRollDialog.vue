<script setup lang="ts">
import { useFinishRoll } from "../queries";
import { finishRollSchema } from "../schema";
import type { RollRow } from "../types";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ row: RollRow }>();
const open = defineModel<boolean>("open", { required: true });

const finish = useFinishRoll();
const loadedOn = computed(() => props.row.roll.startDate);
const schema = finishRollSchema(() => loadedOn.value);
const form = useForm({ schema });
const today = () => new Date().toLocaleDateString("en-CA");

watch(open, (isOpen) => {
  if (isOpen) reset(form, { initialInput: { finishedAt: today() } });
});

async function submit(output: v.InferOutput<typeof schema>) {
  const ok = await attempt(finish.mutateAsync({ id: props.row.roll.id, date: output.finishedAt }));
  if (ok) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Mark as Finished"
    description="The roll leaves the camera and is ready to send for processing"
    submit-label="Mark as finished"
    :pending="finish.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Finish date">
      <FormInput
        :of="form"
        :path="['finishedAt']"
        label="Date finished"
        required
        type="date"
        :min="loadedOn ?? undefined"
        :max="today()"
      />
    </FormSection>
  </SectionedFormDialog>
</template>

<script setup lang="ts">
import { useMarkDeveloped } from "../queries";
import { MarkDevelopedSchema } from "../schema";
import type { RollPlan } from "../types";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{
  rollId: string;
  /** Starts the choice of what comes next. */
  target: RollPlan["target"];
  /** The earliest the film can be developed: the job's sent date, or the finish date. */
  min?: string | null;
}>();
const open = defineModel<boolean>("open", { required: true });

const markDeveloped = useMarkDeveloped();
const form = useForm({ schema: MarkDevelopedSchema });
const today = () => new Date().toLocaleDateString("en-CA");
const targetOptions = [
  { value: "developed", label: "Nothing, develop only" },
  { value: "scanned", label: "Scan it" },
];

watch(open, (isOpen) => {
  if (isOpen)
    reset(form, { initialInput: { developedAt: today(), target: props.target ?? undefined } });
});

async function submit(output: v.InferOutput<typeof MarkDevelopedSchema>) {
  const ok = await attempt(
    markDeveloped.mutateAsync({
      rollId: props.rollId,
      date: output.developedAt,
      target: output.target,
    }),
  );
  if (ok) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Mark as Developed"
    description="The film is developed. A lab keeps the negatives until you record their return."
    submit-label="Mark as developed"
    :pending="markDeveloped.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Developed" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['developedAt']"
          label="Date developed"
          required
          type="date"
          :min="min ?? undefined"
          :max="today()"
        />
        <FormSelect
          :of="form"
          :path="['target']"
          label="What comes next"
          required
          placeholder="Select"
          :options="targetOptions"
        />
      </div>
    </FormSection>
  </SectionedFormDialog>
</template>

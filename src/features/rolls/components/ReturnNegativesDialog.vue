<script setup lang="ts">
import { useReturnHandoff } from "../queries";
import { ReturnNegativesSchema } from "../schema";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ rollId: string; handoffId: string }>();
const open = defineModel<boolean>("open", { required: true });

const returnHandoff = useReturnHandoff();
const form = useForm({ schema: ReturnNegativesSchema });
const today = () => new Date().toLocaleDateString("en-CA");

watch(open, (isOpen) => {
  if (isOpen) reset(form, { initialInput: { returnedAt: today() } });
});

async function submit(output: v.InferOutput<typeof ReturnNegativesSchema>) {
  const ok = await attempt(
    returnHandoff.mutateAsync({
      rollId: props.rollId,
      handoffId: props.handoffId,
      date: output.returnedAt,
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
    title="Negatives Returned"
    description="The roll is home. Every job of this lab stay gets the return date."
    submit-label="Mark as returned"
    :pending="returnHandoff.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Return">
      <FormInput
        :of="form"
        :path="['returnedAt']"
        label="Date returned"
        required
        type="date"
        :max="today()"
      />
    </FormSection>
  </SectionedFormDialog>
</template>

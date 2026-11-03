<script setup lang="ts">
import { useDeleteLab, useLabList, useSaveLab } from "../queries";
import { LabSchema } from "../schema";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";
import LabScannerPicker from "./LabScannerPicker.vue";

const props = defineProps<{ labId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const labs = useLabList();
const save = useSaveLab();
const remove = useDeleteLab();
const form = useForm({ schema: LabSchema });
const editing = computed(() => !!props.labId);
/** The lab's scanners, in order. */
const scannerIds = ref<string[]>([]);
const defaultScannerId = ref<string>();
watch(open, (isOpen) => {
  if (!isOpen) return;
  const lab = labs.data.value?.find((entry) => entry.id === props.labId);
  reset(form, { initialInput: { name: lab?.name ?? "", address: lab?.address ?? "" } });
  scannerIds.value = [...(lab?.scannerIds ?? [])];
  defaultScannerId.value = lab?.defaultScannerId;
});

async function submit(output: v.InferOutput<typeof LabSchema>) {
  let id = props.labId ?? "";
  const ok = await attempt(
    save
      .mutateAsync({
        id: props.labId,
        ...output,
        scannerIds: scannerIds.value,
        defaultScannerId: defaultScannerId.value,
      })
      .then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit("saved", id);
  }
}

async function doDelete() {
  if (!props.labId || !(await ask("Delete this lab?"))) return;
  if (await attempt(remove.mutateAsync(props.labId))) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    :title="editing ? 'Edit Lab' : 'Add Lab'"
    :description="
      editing
        ? 'Update this lab and the scanners it runs'
        : 'Register a lab you send film to for developing and scanning'
    "
    :submit-label="editing ? 'Save changes' : 'Add lab'"
    :pending="save.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Lab" note="* Required attributes">
      <div class="grid gap-y-6">
        <FormInput
          :of="form"
          :path="['name']"
          label="Name"
          required
          placeholder="e.g. Saigon Film Lab"
        />
        <FormInput
          :of="form"
          :path="['address']"
          label="Address"
          optional
          placeholder="e.g. 12 Nguyen Hue, District 1"
        />
      </div>
    </FormSection>

    <FormSection
      no="02"
      title="Scanners"
      note="Jobs sent to this lab offer these. A default is optional"
    >
      <LabScannerPicker v-model="scannerIds" v-model:default-id="defaultScannerId" />
    </FormSection>

    <template v-if="editing" #footer-start>
      <Button
        type="button"
        variant="ghost"
        class="text-destructive hover:text-destructive"
        :disabled="remove.isPending.value"
        @click="doDelete"
      >
        Delete
      </Button>
    </template>
  </SectionedFormDialog>
</template>

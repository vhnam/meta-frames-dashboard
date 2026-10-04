<script setup lang="ts">
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { watch } from "vue";
import FormDialog from "#/components/common/FormDialog.vue";
import FormInput from "#/components/common/FormInput.vue";
import { useLabList, useSaveLab } from "#/api";
import { LabSchema } from "#/domain/schemas";
import { attempt } from "#/lib/ui";

const props = defineProps<{ labId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const labs = useLabList();
const save = useSaveLab();
const form = useForm({ schema: LabSchema });
watch(open, (isOpen) => {
  if (!isOpen) return;
  const l = labs.data.value?.find((x) => x.id === props.labId);
  reset(form, { initialInput: { name: l?.name ?? "", address: l?.address ?? "" } });
});

async function submit(o: v.InferOutput<typeof LabSchema>) {
  let id = props.labId ?? "";
  const ok = await attempt(
    save.mutateAsync({ id: props.labId, ...o }).then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit("saved", id);
  }
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    :title="labId ? 'Edit lab' : 'Add lab'"
    @submit="submit"
  >
    <div class="space-y-6">
      <FormInput :of="form" :path="['name']" label="Name" placeholder="e.g. Saigon Film Lab" />
      <FormInput
        :of="form"
        :path="['address']"
        label="Address"
        optional
        placeholder="e.g. 12 Nguyen Hue, District 1"
      />
    </div>
  </FormDialog>
</template>

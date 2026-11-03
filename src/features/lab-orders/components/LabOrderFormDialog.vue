<script setup lang="ts">
import { useLabList } from "#/features/labs";
import { useSaveLabOrder } from "../queries";
import { LabOrderSchema } from "../schema";
import type { LabOrder, LabOrderLineInput } from "../types";
import { IconPlus, IconTrash } from "@tabler/icons-vue";
import { getInput, reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { formatVnd } from "#/shared/lib/format";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ order?: LabOrder }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const labs = useLabList();
const save = useSaveLabOrder();
const form = useForm({ schema: LabOrderSchema });
const lines = ref<LabOrderLineInput[]>([]);
const linesError = ref<string>();

const newLine = (): LabOrderLineInput => ({
  id: crypto.randomUUID(),
  product: "",
  options: "",
  quantity: 1,
  unitPrice: 0,
});

/** An ISO date-time as a `datetime-local` input reads it: local time, to the minute. */
const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

watch(open, (isOpen) => {
  if (!isOpen) return;
  linesError.value = undefined;
  const order = props.order;
  lines.value = order
    ? order.lines.map(({ id, product, options, quantity, unitPrice }) => ({
        id,
        product,
        options,
        quantity,
        unitPrice,
      }))
    : [newLine()];
  reset(form, {
    initialInput: {
      labId: order?.labId ?? "",
      code: order?.code ?? "",
      orderedAt: toLocalInput(order?.orderedAt ?? new Date().toISOString()),
      dueDate: order?.dueDate ?? undefined,
      vat: order?.vat,
      discount: order?.discount,
      notes: order?.notes || undefined,
    },
  });
});

const labOptions = computed(() =>
  (labs.data.value ?? []).map((lab) => ({ value: lab.id, label: lab.name })),
);
/** Rolls already on each line: a line keeps room for them. */
const jobsOnLine = (lineId: string) =>
  props.order?.lines.find((line) => line.id === lineId)?.jobs.length ?? 0;
const hasRolls = computed(() => !!props.order?.lines.some((line) => line.jobs.length));

const subtotal = computed(() =>
  lines.value.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
);
const total = computed(
  () =>
    subtotal.value +
    (getInput(form, { path: ["vat"] }) ?? 0) -
    (getInput(form, { path: ["discount"] }) ?? 0),
);

function linesProblem() {
  if (!lines.value.length) return "Add at least one line.";
  if (lines.value.some((line) => !line.product.trim())) return "Every line needs a product.";
  if (lines.value.some((line) => !(line.quantity >= 1) || !Number.isInteger(line.quantity)))
    return "Quantity must be a whole number, at least 1.";
  if (lines.value.some((line) => !(line.unitPrice >= 0))) return "Prices must be 0 or more.";
  if (lines.value.some((line) => line.quantity < jobsOnLine(line.id)))
    return "A line cannot take fewer rolls than it already has.";
  return undefined;
}

async function submit(output: v.InferOutput<typeof LabOrderSchema>) {
  linesError.value = linesProblem();
  if (linesError.value) return;
  let id = props.order?.id ?? "";
  const ok = await attempt(
    save
      .mutateAsync({
        id: props.order?.id,
        input: {
          ...output,
          orderedAt: new Date(output.orderedAt).toISOString(),
          lines: lines.value,
        },
      })
      .then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit("saved", id);
  }
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="lg"
    :title="order ? 'Edit Order' : 'Add Order'"
    :description="
      order ? 'Update what the lab billed' : 'Copy the order the lab issued, then add its rolls'
    "
    :submit-label="order ? 'Save changes' : 'Add order'"
    :pending="save.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Order" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormSelect
          :of="form"
          :path="['labId']"
          label="Lab"
          required
          :disabled="hasRolls"
          :hint="hasRolls ? 'The lab is fixed once the order has rolls' : undefined"
          placeholder="Select a lab"
          :options="labOptions"
        />
        <FormInput :of="form" :path="['code']" label="Order code" required placeholder="0510006" />
        <FormInput
          :of="form"
          :path="['orderedAt']"
          label="Created"
          required
          type="datetime-local"
        />
        <FormInput :of="form" :path="['dueDate']" label="Due" optional type="date" />
      </div>
    </FormSection>

    <FormSection no="02" title="Lines" note="One line per product, as on the order">
      <div class="grid gap-3">
        <div class="overflow-x-auto rounded-md border">
          <table class="w-full min-w-[40rem] text-sm">
            <thead class="bg-muted/50">
              <tr class="text-muted-foreground text-left text-xs">
                <th scope="col" class="px-3 py-2 font-medium">Product</th>
                <th scope="col" class="w-20 px-3 py-2 font-medium">Qty</th>
                <th scope="col" class="w-36 px-3 py-2 font-medium">Unit price</th>
                <th scope="col" class="w-32 px-3 py-2 text-right font-medium">Amount</th>
                <th scope="col" class="w-10 px-1 py-2"><span class="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody class="divide-y border-t">
              <tr v-for="(line, index) in lines" :key="line.id" class="align-top">
                <td class="grid gap-2 px-3 py-2">
                  <Input
                    v-model="line.product"
                    :aria-label="`Product of line ${index + 1}`"
                    placeholder="35mm Colour film"
                  />
                  <Input
                    v-model="line.options"
                    :aria-label="`Options of line ${index + 1}`"
                    placeholder="Development + Scan, High-Resolution"
                  />
                </td>
                <td class="px-3 py-2">
                  <Input
                    v-model.number="line.quantity"
                    type="number"
                    min="1"
                    step="1"
                    :aria-label="`Quantity of line ${index + 1}`"
                  />
                </td>
                <td class="px-3 py-2">
                  <Input
                    v-model.number="line.unitPrice"
                    type="number"
                    min="0"
                    step="1000"
                    :aria-label="`Unit price of line ${index + 1}`"
                  />
                </td>
                <td class="px-3 py-4 text-right tabular-nums">
                  {{ formatVnd(line.quantity * line.unitPrice) }}
                </td>
                <td class="px-1 py-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    :disabled="jobsOnLine(line.id) > 0"
                    :aria-label="`Remove line ${index + 1}`"
                    @click="lines.splice(index, 1)"
                  >
                    <IconTrash class="size-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <Button type="button" size="sm" variant="outline" @click="lines.push(newLine())">
            <IconPlus class="size-4" /> Add line
          </Button>
        </div>
        <p v-if="linesError" class="text-destructive text-sm">{{ linesError }}</p>
      </div>
    </FormSection>

    <FormSection no="03" title="Amounts" note="Amounts in dong, as on the order">
      <div class="grid gap-y-4">
        <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <FormInput
            :of="form"
            :path="['vat']"
            label="VAT"
            optional
            type="number"
            min="0"
            step="100"
            suffix="₫"
            placeholder="44800"
          />
          <FormInput
            :of="form"
            :path="['discount']"
            label="Discount"
            optional
            type="number"
            min="0"
            step="100"
            suffix="₫"
            placeholder="0"
          />
        </div>
        <div class="flex items-baseline justify-end gap-4">
          <span class="text-muted-foreground text-sm">Total</span>
          <span class="text-lg font-semibold tabular-nums">{{ formatVnd(total) }}</span>
        </div>
      </div>
    </FormSection>

    <FormSection no="04" title="Notes">
      <FormRichText :of="form" :path="['notes']" label="Notes" optional placeholder="Paid by..." />
    </FormSection>
  </SectionedFormDialog>
</template>

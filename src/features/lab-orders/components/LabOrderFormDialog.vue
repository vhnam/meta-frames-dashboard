<script setup lang="ts">
import { useLabList } from "#/features/labs";
import { useSaveLabOrder } from "../queries";
import { LabOrderSchema } from "../schema";
import type { LabOrder, LabOrderLineInput } from "../types";
import { IconCheck, IconPencil, IconPlus, IconTrash } from "@tabler/icons-vue";
import { getInput, reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, defineAsyncComponent, ref, watch } from "vue";
import FormField from "#/shared/components/FormField.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import { RichText } from "#/shared/components/richText";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { formatVnd } from "#/shared/lib/format";
import { attempt } from "#/shared/lib/ui";

// TipTap is large: load it only when the form opens.
const RichTextEditor = defineAsyncComponent(() => import("#/shared/components/RichTextEditor.vue"));

const props = defineProps<{ order?: LabOrder }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const labs = useLabList();
const save = useSaveLabOrder();
const form = useForm({ schema: LabOrderSchema });
const lines = ref<LabOrderLineInput[]>([]);
const linesError = ref<string>();
/** The line whose description is open: one editor at a time keeps the list short. */
const editingLine = ref<string>();

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
  editingLine.value = undefined;
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
        <ol class="grid gap-3">
          <li
            v-for="(line, index) in lines"
            :key="line.id"
            class="bg-card grid gap-4 rounded-lg border p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                Line {{ index + 1 }}
              </span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold tabular-nums">
                  {{ formatVnd(line.quantity * line.unitPrice) }}
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  :disabled="jobsOnLine(line.id) > 0"
                  :title="jobsOnLine(line.id) > 0 ? 'This line has rolls' : undefined"
                  :aria-label="`Remove line ${index + 1}`"
                  @click="lines.splice(index, 1)"
                >
                  <IconTrash aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div
              class="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-4 sm:grid-cols-[minmax(0,1fr)_5rem_9rem]"
            >
              <FormField label="Product" required class="col-span-2 sm:col-span-1">
                <Input
                  v-model="line.product"
                  :aria-label="`Product of line ${index + 1}`"
                  placeholder="35mm Colour film"
                />
              </FormField>
              <FormField label="Qty" required>
                <Input
                  v-model.number="line.quantity"
                  type="number"
                  min="1"
                  step="1"
                  :aria-label="`Quantity of line ${index + 1}`"
                />
              </FormField>
              <FormField label="Unit price" required>
                <div class="relative">
                  <Input
                    v-model.number="line.unitPrice"
                    type="number"
                    min="0"
                    step="1000"
                    class="pr-7"
                    :aria-label="`Unit price of line ${index + 1}`"
                  />
                  <span
                    class="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs"
                    aria-hidden="true"
                  >
                    ₫
                  </span>
                </div>
              </FormField>
            </div>

            <FormField
              v-if="editingLine === line.id"
              label="Description"
              optional
              role="group"
              :aria-label="`Description of line ${index + 1}`"
            >
              <template #aside>
                <Button type="button" size="xs" variant="outline" @click="editingLine = undefined">
                  <IconCheck aria-hidden="true" /> Done
                </Button>
              </template>
              <RichTextEditor
                v-model="line.options"
                autofocus
                placeholder="Development + Scan, High-Resolution"
              />
            </FormField>
            <div
              v-else-if="line.options"
              class="bg-background/60 flex items-start justify-between gap-3 rounded-md border px-3 py-2"
            >
              <RichText
                :markdown="line.options"
                class="text-muted-foreground line-clamp-2 min-w-0 text-sm"
              />
              <Button
                type="button"
                size="xs"
                variant="ghost"
                class="shrink-0"
                :aria-label="`Edit description of line ${index + 1}`"
                @click="editingLine = line.id"
              >
                <IconPencil aria-hidden="true" /> Edit
              </Button>
            </div>
            <div v-else>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                class="text-muted-foreground -ml-2"
                :aria-label="`Add description to line ${index + 1}`"
                @click="editingLine = line.id"
              >
                <IconPlus aria-hidden="true" /> Add description
              </Button>
            </div>
          </li>
        </ol>
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

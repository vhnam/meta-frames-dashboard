<script setup lang="ts">
import { useDeleteLabOrder, useLabOrderDetail, useSetJobLines } from "../queries";
import { jobsOnOrder, rollsOnOrder, roomOnLine } from "../types";
import type { LabOrderJob, LabOrderLine } from "../types";
import { PROCESSING_TYPE_LABELS } from "#/features/rolls/types";
import { IconChevronRight, IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-vue";
import { Link, useRouter } from "@tanstack/vue-router";
import { computed, ref } from "vue";
import FormSection from "#/shared/components/FormSection.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { RichText } from "#/shared/components/richText";
import { Button } from "#/shared/ui/button";
import { formatDate, formatDateTime, formatVnd } from "#/shared/lib/format";
import { ask, attempt } from "#/shared/lib/ui";
import { cn } from "#/shared/lib/utils";
import AddRollToOrderDialog from "../components/AddRollToOrderDialog.vue";
import LabOrderFormDialog from "../components/LabOrderFormDialog.vue";

const props = defineProps<{ orderId: string }>();
const router = useRouter();
const order = useLabOrderDetail(() => props.orderId);
const deleteOrder = useDeleteLabOrder();
const setLines = useSetJobLines();
const editOpen = ref(false);
const addOpen = ref(false);
const addTo = ref<string>();

function addRoll(line?: LabOrderLine) {
  addTo.value = line?.id;
  addOpen.value = true;
}

async function remove(job: LabOrderJob) {
  if (await ask(`Take ${job.stockName} off this order? The job then has no price.`))
    await attempt(setLines.mutateAsync({ jobId: job.id, lineIds: [] }));
}

async function doDelete() {
  if ((await ask("Delete this order?")) && (await attempt(deleteOrder.mutateAsync(props.orderId))))
    router.navigate({ to: "/app/orders" });
}

const CHIP = "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm";

/** Every roll on the order once, with the lines that bill it. */
const rolls = computed(() => (order.data.value ? jobsOnOrder(order.data.value) : []));
</script>

<template>
  <QueryBoundary :query="order" empty-text="Order not found.">
    <template #default="{ data }">
      <div class="grid gap-6">
        <!-- header -->
        <section class="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div class="from-primary/70 to-primary h-1 bg-linear-to-r via-amber-400" />
          <div class="grid gap-6 p-6 md:p-8">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                <span
                  class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-semibold tracking-[0.12em] uppercase"
                >
                  <i class="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                  Lab order
                </span>
                <span class="tracking-[0.08em] uppercase">ID: {{ data.id.slice(0, 8) }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  class="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  @click="doDelete"
                >
                  <IconTrash aria-hidden="true" /> Delete
                </Button>
                <Button variant="outline" class="bg-card" @click="editOpen = true">
                  <IconPencil aria-hidden="true" /> Edit order
                </Button>
                <Button
                  :disabled="!data.lines.some((line) => roomOnLine(line) > 0)"
                  @click="addRoll()"
                >
                  <IconPlus aria-hidden="true" /> Add roll
                </Button>
              </div>
            </div>

            <div class="grid gap-4">
              <h1 class="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
                #{{ data.code }}
              </h1>
              <div class="flex flex-wrap gap-2">
                <span
                  :class="
                    cn(
                      CHIP,
                      'border-amber-300 bg-amber-50 font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
                    )
                  "
                >
                  Lab: {{ data.labName }}
                </span>
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-4">
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Created
                </dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatDateTime(data.orderedAt) }}
                </dd>
              </div>
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">Due</dt>
                <dd
                  :class="
                    cn(
                      'text-lg font-semibold tabular-nums',
                      !data.dueDate && 'text-muted-foreground',
                    )
                  "
                >
                  {{ formatDate(data.dueDate) }}
                </dd>
              </div>
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Rolls
                </dt>
                <dd class="text-lg font-semibold tabular-nums">{{ rollsOnOrder(data).rolls }}</dd>
                <dd class="text-muted-foreground text-xs">
                  {{ rollsOnOrder(data).taken }} of {{ rollsOnOrder(data).billed }} places taken
                </dd>
              </div>
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Total
                </dt>
                <dd class="text-primary text-lg font-semibold tabular-nums">
                  {{ formatVnd(data.total) }}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <div
          class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <!-- lines and notes -->
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
            <div class="bg-card min-w-0 rounded-xl border p-6 shadow-sm">
              <FormSection no="01" :title="`Order lines (${data.lines.length})`">
                <div class="overflow-x-auto">
                  <table class="w-full min-w-lg text-sm">
                    <thead>
                      <tr
                        class="text-muted-foreground border-b text-[0.7rem] tracking-[0.12em] uppercase"
                      >
                        <th scope="col" class="py-2 pr-3 text-left font-normal">Product</th>
                        <th scope="col" class="px-3 py-2 text-center font-normal">Qty</th>
                        <th scope="col" class="w-32 px-3 py-2 text-right font-normal">
                          Unit price
                        </th>
                        <th scope="col" class="w-32 py-2 pl-3 text-right font-normal">Amount</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y">
                      <tr v-for="line in data.lines" :key="line.id" class="align-top">
                        <td class="py-3 pr-3">
                          <div class="font-semibold">{{ line.product }}</div>
                          <RichText
                            v-if="line.options"
                            :markdown="line.options"
                            class="text-muted-foreground mt-0.5"
                          />
                          <div class="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                            <span class="tabular-nums">
                              {{ line.jobs.length }} of {{ line.quantity }} rolls ·
                              {{ formatVnd(line.unitCost) }} each with VAT
                            </span>
                            <Button
                              v-if="roomOnLine(line) > 0"
                              variant="outline"
                              size="xs"
                              @click="addRoll(line)"
                            >
                              Add
                            </Button>
                          </div>
                        </td>
                        <td class="px-3 py-3 text-center tabular-nums">{{ line.quantity }}</td>
                        <td class="text-muted-foreground px-3 py-3 text-right tabular-nums">
                          {{ formatVnd(line.unitPrice) }}
                        </td>
                        <td class="py-3 pl-3 text-right font-semibold tabular-nums">
                          {{ formatVnd(line.lineTotal) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="02" title="Notes">
                <RichText
                  v-if="data.notes"
                  :markdown="data.notes"
                  class="bg-background/60 rounded-lg border p-4 text-sm"
                />
                <p v-else class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  No notes yet.
                </p>
              </FormSection>
            </div>
          </div>

          <!-- amounts and rolls -->
          <aside class="grid min-w-0 gap-6">
            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="AMT" title="Amounts">
                <dl class="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
                  <dt class="text-muted-foreground">Subtotal</dt>
                  <dd class="text-right tabular-nums">{{ formatVnd(data.subtotal) }}</dd>
                  <dt class="text-muted-foreground">VAT</dt>
                  <dd class="text-right tabular-nums">{{ formatVnd(data.vat) }}</dd>
                  <template v-if="data.discount > 0">
                    <dt class="text-muted-foreground">Discount</dt>
                    <dd class="text-right tabular-nums">-{{ formatVnd(data.discount) }}</dd>
                  </template>
                  <div class="col-span-2 mt-2 flex items-baseline justify-between border-t pt-3">
                    <dt class="font-semibold">Total</dt>
                    <dd class="text-primary text-lg font-semibold tabular-nums">
                      {{ formatVnd(data.total) }}
                    </dd>
                  </div>
                </dl>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="LOG" :title="`Rolls (${rolls.length})`">
                <ul v-if="rolls.length" class="grid max-h-128 gap-3 overflow-y-auto">
                  <li
                    v-for="{ job, lines } in rolls"
                    :key="job.id"
                    class="overflow-hidden rounded-lg border text-sm"
                  >
                    <div class="flex items-stretch">
                      <Link
                        to="/app/rolls/$rollId"
                        :params="{ rollId: job.rollId }"
                        class="hover:bg-accent/40 group flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <span class="grid min-w-0 gap-0.5">
                          <span class="truncate font-medium" :title="job.stockName">
                            {{ job.stockName }}
                          </span>
                          <span class="text-muted-foreground text-xs">
                            {{ job.format }} · {{ job.exposures }} exp ·
                            {{ PROCESSING_TYPE_LABELS[job.type] }}
                          </span>
                          <span class="text-muted-foreground text-xs tabular-nums">
                            Sent {{ formatDate(job.sentDate) }}
                          </span>
                        </span>
                        <IconChevronRight
                          class="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                      <div class="flex items-center border-l px-1">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          class="text-muted-foreground hover:text-destructive"
                          :title="`Take ${job.stockName} off this order`"
                          :aria-label="`Take ${job.stockName} off this order`"
                          @click="remove(job)"
                        >
                          <IconX aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div class="bg-background/60 grid gap-1.5 border-t px-3 py-2">
                      <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                        Billed on
                      </span>
                      <ul class="grid divide-y text-xs">
                        <li
                          v-for="line in lines"
                          :key="line.id"
                          class="py-1.5 first:pt-0 last:pb-0"
                        >
                          <span class="line-clamp-2" :title="line.product">
                            {{ line.product }}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </li>
                </ul>
                <p v-else class="text-muted-foreground text-sm">No rolls on this order yet.</p>
              </FormSection>
            </div>
          </aside>
        </div>
      </div>

      <LabOrderFormDialog v-model:open="editOpen" :order="data" />
      <AddRollToOrderDialog v-model:open="addOpen" :order="data" :line-id="addTo" />
    </template>
  </QueryBoundary>
</template>

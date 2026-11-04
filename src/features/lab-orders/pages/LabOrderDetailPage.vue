<script setup lang="ts">
import { useDeleteLabOrder, useLabOrderDetail, useSetJobLines } from "../queries";
import { roomOnLine } from "../types";
import type { LabOrderJob, LabOrderLine } from "../types";
import { PROCESSING_TYPE_LABELS } from "#/features/rolls/types";
import { IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-vue";
import { Link, useRouter } from "@tanstack/vue-router";
import { ref } from "vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { RichText } from "#/shared/components/richText";
import { Button } from "#/shared/ui/button";
import { Card, CardContent } from "#/shared/ui/card";
import { formatDate, formatDateTime, formatVnd } from "#/shared/lib/format";
import { ask, attempt } from "#/shared/lib/ui";
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
</script>

<template>
  <QueryBoundary :query="order" :is-empty="() => false">
    <template #default="{ data }">
      <div class="mx-auto grid w-full max-w-4xl gap-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h1 class="font-heading text-2xl font-semibold tabular-nums">#{{ data.code }}</h1>
            <p class="text-muted-foreground text-sm">{{ data.labName }}</p>
          </div>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              class="text-destructive hover:text-destructive"
              @click="doDelete"
            >
              <IconTrash class="size-4" /> Delete
            </Button>
            <Button type="button" variant="outline" @click="editOpen = true">
              <IconPencil class="size-4" /> Edit
            </Button>
            <Button
              type="button"
              :disabled="!data.lines.some((line) => roomOnLine(line) > 0)"
              @click="addRoll()"
            >
              <IconPlus class="size-4" /> Add roll
            </Button>
          </div>
        </div>

        <Card>
          <CardContent class="grid gap-6">
            <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt class="text-muted-foreground">Created</dt>
              <dd class="text-right tabular-nums">{{ formatDateTime(data.orderedAt) }}</dd>
              <dt class="text-muted-foreground">Due</dt>
              <dd class="text-right tabular-nums">{{ formatDate(data.dueDate) }}</dd>
            </dl>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr class="text-muted-foreground border-b text-xs uppercase">
                    <th scope="col" class="py-2 pr-3 text-left font-medium">Product</th>
                    <th scope="col" class="px-3 py-2 text-center font-medium">Qty</th>
                    <th scope="col" class="px-3 py-2 text-right font-medium">Unit price</th>
                    <th scope="col" class="py-2 pl-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="line in data.lines" :key="line.id" class="align-top">
                    <td class="py-3 pr-3">
                      <div class="font-semibold">{{ line.product }}</div>
                      <div v-if="line.options" class="text-muted-foreground mt-0.5">
                        {{ line.options }}
                      </div>
                      <ul v-if="line.jobs.length" class="mt-2 grid gap-1">
                        <li
                          v-for="job in line.jobs"
                          :key="job.id"
                          class="flex items-center justify-between gap-2"
                        >
                          <Link
                            to="/app/rolls/$rollId"
                            :params="{ rollId: job.rollId }"
                            class="min-w-0 truncate underline-offset-2 hover:underline"
                          >
                            {{ job.stockName }} · {{ job.format }} ·
                            {{ PROCESSING_TYPE_LABELS[job.type] }}
                          </Link>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            class="size-6 shrink-0"
                            :aria-label="`Take ${job.stockName} off this order`"
                            @click="remove(job)"
                          >
                            <IconX class="size-3.5" />
                          </Button>
                        </li>
                      </ul>
                      <div class="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                        <span class="tabular-nums">
                          {{ line.jobs.length }} of {{ line.quantity }} rolls ·
                          {{ formatVnd(line.unitCost) }} each with VAT
                        </span>
                        <Button
                          v-if="roomOnLine(line) > 0"
                          type="button"
                          size="sm"
                          variant="outline"
                          class="h-6 px-2 text-xs"
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

            <dl class="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
              <dt class="text-muted-foreground text-right">Subtotal</dt>
              <dd class="text-right tabular-nums">{{ formatVnd(data.subtotal) }}</dd>
              <dt class="text-muted-foreground text-right">VAT</dt>
              <dd class="text-right tabular-nums">{{ formatVnd(data.vat) }}</dd>
              <dt class="text-muted-foreground text-right">Discount</dt>
              <dd class="text-right tabular-nums">-{{ formatVnd(data.discount) }}</dd>
              <dt class="pt-2 text-right font-semibold">Total</dt>
              <dd class="text-primary pt-2 text-right text-lg font-semibold tabular-nums">
                {{ formatVnd(data.total) }}
              </dd>
            </dl>

            <RichText v-if="data.notes" :markdown="data.notes" class="text-sm leading-relaxed" />
          </CardContent>
        </Card>
      </div>
      <LabOrderFormDialog v-model:open="editOpen" :order="data" />
      <AddRollToOrderDialog v-model:open="addOpen" :order="data" :line-id="addTo" />
    </template>
  </QueryBoundary>
</template>

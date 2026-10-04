<script setup lang="ts">
import { Link, useRouter } from "@tanstack/vue-router";
import { ref } from "vue";
import { useDeleteStock, useRollList, useStockDetail } from "#/api";
import PageHeader from "#/components/common/PageHeader.vue";
import QueryBoundary from "#/components/common/QueryBoundary.vue";
import StatusBadge from "#/components/common/StatusBadge.vue";
import StockFormDialog from "#/components/dialogs/StockFormDialog.vue";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { formatExpiry, stockName, stockWarnings } from "#/domain/format";
import { FILM_TYPE_LABELS, PACKAGING_LABELS } from "#/domain/types";
import { ask, attempt } from "#/lib/ui";

const props = defineProps<{ stockId: string }>();
const router = useRouter();
const detail = useStockDetail(() => props.stockId);
const rolls = useRollList(() => ({ stockId: props.stockId }));
const deleteStock = useDeleteStock();
const editOpen = ref(false);

async function doDelete() {
  if (ask("Delete this stock?") && (await attempt(deleteStock.mutateAsync(props.stockId))))
    router.navigate({ to: "/stocks" });
}
</script>

<template>
  <QueryBoundary :query="detail" empty-text="Stock not found.">
    <template #default="{ data: d }">
      <PageHeader
        :title="stockName(d.stock)"
        :description="`${FILM_TYPE_LABELS[d.stock.type]} · ISO ${d.stock.boxIso} · ${d.stock.process} · ${PACKAGING_LABELS[d.stock.packaging]}`"
      >
        <template #actions>
          <Button variant="outline" @click="editOpen = true">Edit</Button>
          <Button variant="ghost" @click="doDelete">Delete</Button>
        </template>
      </PageHeader>
      <div class="mt-4 grid gap-4">
        <p v-for="w in stockWarnings(d.stock)" :key="w" class="text-sm text-amber-600">{{ w }}</p>
        <Card v-if="d.stock.description || d.stock.stockOrigin || d.stock.packOrigin">
          <CardContent class="grid gap-1 pt-6 text-sm">
            <span v-if="d.stock.stockOrigin">Stock origin: {{ d.stock.stockOrigin }}</span>
            <span v-if="d.stock.packOrigin">Pack origin: {{ d.stock.packOrigin }}</span>
            <span v-if="d.stock.description">{{ d.stock.description }}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Same emulsion</CardTitle></CardHeader>
          <CardContent class="grid gap-2 text-sm">
            <p
              v-if="!d.base && !d.siblings.length && !d.children.length"
              class="text-muted-foreground"
            >
              No base stock and no stocks based on this one.
            </p>
            <div v-if="d.base">
              Base:
              <Link
                to="/stocks/$stockId"
                :params="{ stockId: d.base.id }"
                class="font-medium hover:underline"
              >
                {{ stockName(d.base) }}
              </Link>
            </div>
            <div v-if="d.siblings.length">
              Also based on it:
              <Link
                v-for="s in d.siblings"
                :key="s.id"
                to="/stocks/$stockId"
                :params="{ stockId: s.id }"
                class="mr-2 font-medium hover:underline"
              >
                {{ stockName(s) }}
              </Link>
            </div>
            <div v-if="d.children.length">
              Repacked as:
              <Link
                v-for="s in d.children"
                :key="s.id"
                to="/stocks/$stockId"
                :params="{ stockId: s.id }"
                class="mr-2 font-medium hover:underline"
              >
                {{ stockName(s) }}
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            ><CardTitle>Rolls ({{ rolls.data.value?.length ?? 0 }})</CardTitle></CardHeader
          >
          <CardContent class="grid gap-1">
            <Link
              v-for="r in rolls.data.value ?? []"
              :key="r.roll.id"
              to="/rolls/$rollId"
              :params="{ rollId: r.roll.id }"
              class="hover:bg-accent/40 flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              {{ r.roll.format }} · exp {{ formatExpiry(r.roll) }}
              <StatusBadge :status="r.roll.status" />
            </Link>
          </CardContent>
        </Card>
      </div>
      <StockFormDialog v-model:open="editOpen" :stock-id="d.stock.id" />
    </template>
  </QueryBoundary>
</template>

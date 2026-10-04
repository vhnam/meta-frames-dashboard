<script setup lang="ts">
import { cameraName } from "#/features/cameras";
import { stockName } from "#/features/film-stocks";
import { formatVnd } from "#/shared/lib/format";
import { formatExpiry } from "../format";
import { useDeleteRoll, useFinishRoll, useRollDetail } from "../queries";
import type { RollDetail, RollRow } from "../types";
import { useRouter } from "@tanstack/vue-router";
import { computed, ref } from "vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStatusBadge from "../components/RollStatusBadge.vue";
import RollEditDialog from "../components/RollEditDialog.vue";
import RollLensesDialog from "../components/RollLensesDialog.vue";
import SendToLabDialog from "../components/SendToLabDialog.vue";
import LoadRollDialog from "../components/LoadRollDialog.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";
import { ask, attempt } from "#/shared/lib/ui";

const props = defineProps<{ rollId: string }>();
const router = useRouter();
const detail = useRollDetail(() => props.rollId);
const deleteRoll = useDeleteRoll();
const finishRoll = useFinishRoll();

const editOpen = ref(false);
const loadOpen = ref(false);
const lensesOpen = ref(false);
const labOpen = ref(false);

async function doDelete() {
  if (ask("Delete this roll?") && (await attempt(deleteRoll.mutateAsync(props.rollId))))
    router.navigate({ to: "/rolls" });
}

const rowOf = (d: RollDetail): RollRow => ({
  roll: d.roll,
  stockName: stockName(d.stock),
  boxIso: d.stock.boxIso,
  cameraName: d.camera ? cameraName(d.camera) : null,
  negativesAtLab: d.negativesAtLab,
});

const data = computed(() => detail.data.value);
const kv = computed(() => {
  const d = data.value;
  if (!d) return [];
  return [
    ["Format", `${d.roll.format} · ${d.roll.exposures} exp`],
    ["Price", formatVnd(d.roll.price)],
    ["Expiry", formatExpiry(d.roll)],
    ["Box ISO", String(d.stock.boxIso)],
    ["Started", d.roll.startDate ?? "—"],
    ["Total cost", formatVnd(d.cost.total) + (d.cost.incomplete ? " (incomplete)" : "")],
  ];
});
const showNegBadge = (status: string, atLab: boolean) =>
  (status === "scanned" || status === "developed") && atLab;
</script>

<template>
  <QueryBoundary :query="detail" empty-text="Roll not found.">
    <template #default="{ data: d }">
      <PageHeader
        :title="stockName(d.stock)"
        :description="d.base ? `Base stock: ${stockName(d.base)}` : undefined"
      >
        <template #actions>
          <RollStatusBadge :status="d.roll.status" />
          <Badge v-if="showNegBadge(d.roll.status, d.negativesAtLab)" variant="outline">
            Negatives at lab
          </Badge>
          <Button v-if="d.roll.status === 'in_stock'" @click="loadOpen = true">
            Load into camera
          </Button>
          <Button
            v-if="d.roll.status === 'in_camera'"
            :disabled="finishRoll.isPending.value"
            @click="attempt(finishRoll.mutateAsync(d.roll.id))"
          >
            Mark as finished
          </Button>
          <Button v-if="d.roll.status === 'done_shooting'" @click="labOpen = true">
            Send to lab
          </Button>
          <Button variant="outline" @click="editOpen = true">Edit</Button>
          <Button v-if="d.roll.status === 'in_stock'" variant="ghost" @click="doDelete"
            >Delete</Button
          >
        </template>
      </PageHeader>

      <div class="mt-4 grid gap-4">
        <Card>
          <CardContent class="grid gap-3 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="[k, val] in kv" :key="k">
              <div class="text-muted-foreground text-xs">{{ k }}</div>
              {{ val }}
            </div>
            <div v-if="d.roll.description" class="sm:col-span-2 lg:col-span-4">
              <div class="text-muted-foreground text-xs">Description</div>
              {{ d.roll.description }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Camera &amp; lenses</CardTitle>
            <Button
              v-if="d.camera && !d.camera.fixedLens"
              type="button"
              variant="outline"
              size="sm"
              @click="lensesOpen = true"
            >
              Manage lenses
            </Button>
          </CardHeader>
          <CardContent class="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div class="text-muted-foreground text-xs">Camera</div>
              {{ d.camera ? cameraName(d.camera) : "—" }}
            </div>
            <div>
              <div class="text-muted-foreground text-xs">Lenses</div>
              <p v-if="!d.lenses.length">—</p>
              <div v-for="l in d.lenses" :key="l.id" class="grid">
                <span>{{ [l.brand, l.model].filter(Boolean).join(" ") }}</span>
                <span class="text-muted-foreground text-xs">{{ l.mount }} mount</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Processing history</CardTitle></CardHeader>
          <CardContent class="grid gap-2 text-sm">
            <p v-if="!d.jobs.length" class="text-muted-foreground">Not sent for processing yet.</p>
            <div
              v-for="j in d.jobs"
              :key="j.id"
              class="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
            >
              <span class="font-medium">{{ j.labName }}</span>
              <span>{{ j.type.replace("_", " + ") }} · {{ j.process }}</span>
              <span class="text-muted-foreground">sent {{ j.sentDate }}</span>
              <span class="text-muted-foreground">{{ formatVnd(j.price) }}</span>
              <Badge :variant="j.open ? 'destructive' : 'secondary'">{{
                j.open ? "Open" : "Closed"
              }}</Badge>
              <span v-if="j.notes" class="text-muted-foreground w-full text-xs">{{ j.notes }}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Frames</CardTitle></CardHeader>
          <CardContent class="grid gap-3 text-sm">
            <p v-if="!d.frames.length" class="text-muted-foreground">No frames yet.</p>
            <div
              v-for="f in d.frames"
              :key="f.frame.number"
              class="flex items-start gap-3 rounded-md border px-3 py-2"
            >
              <span class="w-10 font-medium tabular-nums">#{{ f.frame.number }}</span>
              <span class="flex-1">{{ f.frame.notes || "—" }}</span>
              <span class="text-muted-foreground w-16 text-right text-xs"
                >{{ f.scanCount }} scan(s)</span
              >
            </div>
          </CardContent>
        </Card>
      </div>

      <RollEditDialog v-model:open="editOpen" :row="rowOf(d)" />
      <RollLensesDialog
        v-model:open="lensesOpen"
        :roll-id="d.roll.id"
        :camera-name="d.camera ? cameraName(d.camera) : undefined"
        :candidates="d.cameraLenses"
        :selected-ids="d.lenses.map((l) => l.id)"
      />
      <SendToLabDialog
        v-model:open="labOpen"
        :row="rowOf(d)"
        :process="d.stock.process"
        :finished-on="d.roll.finishDate"
      />
      <LoadRollDialog v-model:open="loadOpen" :row="rowOf(d)" />
    </template>
  </QueryBoundary>
</template>

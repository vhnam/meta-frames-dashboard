<script setup lang="ts">
import { formatVnd } from "#/shared/lib/format";
import { formatExpiry } from "../../format";
import type { RollDetail } from "../../types";
import { computed } from "vue";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";

const props = defineProps<{ detail: RollDetail }>();
defineEmits<{ edit: []; delete: [] }>();

const facts = computed(() => {
  const { roll, stock } = props.detail;
  return [
    { label: "Format", value: `${roll.format} · ${roll.exposures} exp` },
    { label: "Box ISO", value: String(stock.boxIso) },
    { label: "Expiry", value: formatExpiry(roll) },
    { label: "Started", value: roll.startDate ?? "—" },
  ];
});
const processingCost = computed(() =>
  props.detail.jobs.reduce((sum, j) => sum + (j.price ?? 0), 0),
);
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Summary</CardTitle>
      <div class="flex gap-2">
        <Button type="button" variant="outline" size="sm" @click="$emit('edit')">Edit</Button>
        <Button
          v-if="detail.roll.status === 'in_stock'"
          type="button"
          variant="ghost"
          size="sm"
          @click="$emit('delete')"
        >
          Delete
        </Button>
      </div>
    </CardHeader>
    <CardContent class="grid gap-4 text-sm">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
        <div v-for="f in facts" :key="f.label">
          <dt class="text-muted-foreground text-xs">{{ f.label }}</dt>
          <dd class="font-medium tabular-nums">{{ f.value }}</dd>
        </div>
      </dl>
      <div v-if="detail.roll.description">
        <div class="text-muted-foreground text-xs">Description</div>
        <p>{{ detail.roll.description }}</p>
      </div>
      <div class="bg-muted/50 grid gap-1 rounded-lg px-4 py-3">
        <div class="text-muted-foreground text-xs">Total cost</div>
        <div class="text-lg font-semibold tabular-nums">
          {{ formatVnd(detail.cost.total) }}
          <span v-if="detail.cost.incomplete" class="text-muted-foreground text-xs font-normal">
            (incomplete)
          </span>
        </div>
        <div class="text-muted-foreground text-xs tabular-nums">
          Film {{ formatVnd(detail.roll.price) }} + processing {{ formatVnd(processingCost) }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>

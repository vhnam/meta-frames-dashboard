<script setup lang="ts">
import { RichText } from "#/shared/components/richText";
import { formatDate, formatVnd } from "#/shared/lib/format";
import { formatExpiry } from "../../format";
import type { RollDetail } from "../../types";
import { computed } from "vue";
import FormSection from "#/shared/components/FormSection.vue";
import SpecTile from "#/shared/components/SpecTile.vue";

const props = defineProps<{ detail: RollDetail }>();

const facts = computed(() => {
  const { roll, stock } = props.detail;
  return [
    { label: "Format", value: `${roll.format} · ${roll.exposures} exp` },
    { label: "Box ISO", value: String(stock.boxIso) },
    { label: "Expiry", value: formatExpiry(roll) },
    { label: "Started", value: formatDate(roll.startDate) },
  ];
});
const processingCost = computed(() =>
  props.detail.jobs.reduce((sum, job) => sum + (job.price ?? 0), 0),
);
</script>

<template>
  <div class="bg-card rounded-xl border p-6 shadow-sm">
    <FormSection no="01" title="Summary">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SpecTile v-for="fact in facts" :key="fact.label" :label="fact.label">
          <span class="tabular-nums">{{ fact.value }}</span>
        </SpecTile>
      </div>
      <RichText
        v-if="detail.roll.description"
        :markdown="detail.roll.description"
        class="bg-background/60 rounded-lg border p-4 text-sm"
      />
      <SpecTile
        label="Total cost"
        :sub="`Film ${formatVnd(detail.roll.price)} + processing ${formatVnd(processingCost)}`"
      >
        <span class="text-lg tabular-nums">{{ formatVnd(detail.cost.total) }}</span>
        <span v-if="detail.cost.incomplete" class="text-muted-foreground text-xs font-normal">
          (incomplete)
        </span>
      </SpecTile>
    </FormSection>
  </div>
</template>

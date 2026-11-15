<script setup lang="ts">
import { computed } from 'vue';

import FormSection from '#/shared/components/form-section/FormSection.vue';
import { RichText } from '#/shared/components/rich-text/richText';
import SpecTile from '#/shared/components/spec-tile/SpecTile.vue';
import { formatDate, formatVnd } from '#/shared/lib/format';

import { formatExpiry } from '../../format';
import type { RollDetail } from '../../types';

const props = defineProps<{ detail: RollDetail }>();

const facts = computed(() => {
  const { roll, stock } = props.detail;
  return [
    { label: 'Format', value: `${roll.format} · ${roll.exposures} exp` },
    { label: 'Box ISO', value: String(stock.boxIso) },
    { label: 'Expiry', value: formatExpiry(roll) },
    { label: 'Started', value: formatDate(roll.startDate) },
  ];
});
const processingCost = computed(() =>
  props.detail.jobs.reduce((sum, job) => sum + (job.price ?? 0), 0),
);
</script>

<template>
  <div class="rounded-xl border bg-card p-6 shadow-sm">
    <FormSection
      no="01"
      title="Summary"
    >
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SpecTile
          v-for="fact in facts"
          :key="fact.label"
          :label="fact.label"
        >
          <span class="tabular-nums">{{ fact.value }}</span>
        </SpecTile>
      </div>
      <RichText
        v-if="detail.roll.description"
        :markdown="detail.roll.description"
        class="rounded-lg border bg-background/60 p-4 text-sm"
      />
      <SpecTile
        label="Total cost"
        :sub="`Film ${formatVnd(detail.roll.price)} + processing ${formatVnd(processingCost)}`"
      >
        <span class="text-lg tabular-nums">{{ formatVnd(detail.cost.total) }}</span>
        <span
          v-if="detail.cost.incomplete"
          class="text-xs font-normal text-muted-foreground"
        >
          (incomplete)
        </span>
      </SpecTile>
    </FormSection>
  </div>
</template>

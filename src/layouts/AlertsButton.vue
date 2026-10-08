<script setup lang="ts">
import { IconBell } from "@tabler/icons-vue";
import { Link } from "@tanstack/vue-router";
import { computed } from "vue";
import { useExpiryReport } from "#/features/rolls";
import { Button } from "#/shared/ui/button";

// in-stock rolls that are expired or expire within 6 months
const expiry = useExpiryReport();
const count = computed(() => expiry.data.value?.dated.length ?? 0);
</script>

<template>
  <Button variant="outline" size="sm" class="bg-card h-9 gap-2 px-3" as-child>
    <Link
      to="/app/expiry"
      :aria-label="count ? `Alerts: ${count} rolls expired or expiring soon` : 'Alerts'"
    >
      <IconBell class="size-4" aria-hidden="true" />
      Alerts
      <span
        v-if="count"
        class="bg-destructive flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.7rem] font-semibold text-white tabular-nums"
      >
        {{ count }}
      </span>
    </Link>
  </Button>
</template>

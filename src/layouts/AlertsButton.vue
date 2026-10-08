<script setup lang="ts">
import { IconBell, IconBellOff, IconCalendarX, IconClockHour4 } from "@tabler/icons-vue";
import { Link } from "@tanstack/vue-router";
import { computed, ref, useTemplateRef } from "vue";
import { expiryFromNow, useExpiryReport } from "#/features/rolls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/shared/ui/tooltip";

/** Rows shown in the panel; the rest are on the Expiry page. */
const SHOWN = 6;

// in-stock rolls that are expired or expire within 6 months, most overdue first
const expiry = useExpiryReport();
const alerts = computed(() => expiry.data.value?.dated ?? []);
const count = computed(() => alerts.value.length);
const badge = computed(() => (count.value > 99 ? "99+" : String(count.value)));
const label = computed(() =>
  count.value ? `Alerts · ${count.value} ${count.value === 1 ? "roll" : "rolls"}` : "Alerts",
);

// the tooltip stays shut while the panel is open, so it never covers the list
const menuOpen = ref(false);
const tipOpen = ref(false);
// Both triggers register their anchor with the nearest popper, which is the tooltip's, so the
// panel would have no anchor and stay hidden: anchor it to the bell explicitly.
const bell = useTemplateRef<{ $el: HTMLElement }>("bell");
const bellEl = computed(() => bell.value?.$el);

function setMenuOpen(open: boolean) {
  menuOpen.value = open;
  if (open) tipOpen.value = false;
}
</script>

<template>
  <DropdownMenu :open="menuOpen" @update:open="setMenuOpen">
    <Tooltip :open="tipOpen" @update:open="(o) => (tipOpen = o && !menuOpen)">
      <TooltipTrigger as-child>
        <DropdownMenuTrigger
          ref="bell"
          class="bg-secondary hover:bg-accent data-[state=open]:bg-primary/10 data-[state=open]:text-primary focus-visible:ring-ring/50 relative flex size-10 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3"
          :aria-label="count ? `Alerts: ${count} rolls expired or expiring soon` : 'Alerts'"
        >
          <IconBell class="size-5" aria-hidden="true" />
          <span
            v-if="count"
            class="bg-destructive ring-sidebar absolute -top-1 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.7rem] font-semibold text-white tabular-nums ring-2"
            aria-hidden="true"
          >
            {{ badge }}
          </span>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent side="bottom">{{ label }}</TooltipContent>
    </Tooltip>
    <DropdownMenuContent
      :reference="bellEl"
      align="end"
      :side-offset="8"
      class="w-88 max-w-[calc(100vw-2rem)] rounded-xl p-0 shadow-lg"
    >
      <div class="flex items-baseline justify-between gap-3 px-4 pt-4 pb-2">
        <h2 class="font-heading text-lg font-bold">Alerts</h2>
        <span v-if="count" class="text-muted-foreground text-xs">
          {{ count }} {{ count === 1 ? "roll" : "rolls" }}
        </span>
      </div>

      <div v-if="count" class="grid max-h-104 gap-0.5 overflow-y-auto px-1.5 pb-1.5">
        <DropdownMenuItem
          v-for="r in alerts.slice(0, SHOWN)"
          :key="r.roll.id"
          class="items-start gap-3 rounded-lg p-2.5"
          as-child
        >
          <Link :to="'/app/rolls/$rollId'" :params="{ rollId: r.roll.id }">
            <span
              :class="[
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                r.expired
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
              ]"
              aria-hidden="true"
            >
              <component :is="r.expired ? IconCalendarX : IconClockHour4" class="size-5" />
            </span>
            <span class="grid min-w-0 gap-0.5">
              <span class="text-sm leading-snug">
                <span class="font-semibold">{{ r.stockName }}</span>
                <span class="text-muted-foreground">
                  · {{ r.roll.format }} · {{ r.roll.exposures }} exp</span
                >
              </span>
              <span
                :class="[
                  'text-xs font-medium',
                  r.expired ? 'text-destructive' : 'text-amber-700 dark:text-amber-400',
                ]"
              >
                {{ expiryFromNow(r.roll) }}
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
      </div>

      <div v-else class="grid justify-items-center gap-2 px-6 pt-4 pb-8 text-center">
        <span
          class="bg-secondary text-muted-foreground flex size-12 items-center justify-center rounded-full"
        >
          <IconBellOff class="size-6" aria-hidden="true" />
        </span>
        <p class="text-sm font-medium">
          {{ expiry.isPending.value ? "Checking your stock…" : "No alerts" }}
        </p>
        <p v-if="!expiry.isPending.value" class="text-muted-foreground text-xs">
          No roll in stock is expired or expiring within 6 months.
        </p>
      </div>

      <div class="border-t p-1.5">
        <DropdownMenuItem
          class="text-primary justify-center rounded-lg py-2 text-sm font-semibold"
          as-child
        >
          <Link to="/app/expiry">See all on the Expiry page</Link>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

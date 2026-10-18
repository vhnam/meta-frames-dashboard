<script setup lang="ts">
import {
  AddRollsDialog,
  RollStatusBadge,
  expiryDate,
  formatExpiry,
  isExpired,
} from "#/features/rolls";
import { PACKAGING_TONE, TYPE_TONE, stockName, stockWarnings } from "../format";
import { useDeleteStock, useStockDetail } from "../queries";
import { FILM_TYPE_LABELS, PACKAGING_LABELS } from "../types";
import { IconChevronRight, IconPencil, IconPlus, IconTrash } from "@tabler/icons-vue";
import { Link, useRouter } from "@tanstack/vue-router";
import { computed, ref } from "vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { RichText } from "#/shared/components/richText";
import StockFormDialog from "../components/StockFormDialog.vue";
import FormSection from "#/shared/components/FormSection.vue";
import SpecTile from "#/shared/components/SpecTile.vue";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";
import { cn } from "#/shared/lib/utils";
import { useRollList } from "#/features/rolls";

const props = defineProps<{ stockId: string }>();
const router = useRouter();
const detail = useStockDetail(() => props.stockId);
const rolls = useRollList(() => ({ stockId: props.stockId }));
const deleteStock = useDeleteStock();
const editOpen = ref(false);
const addOpen = ref(false);

async function doDelete() {
  if ((await ask("Delete this stock?")) && (await attempt(deleteStock.mutateAsync(props.stockId))))
    router.navigate({ to: "/app/stocks" });
}

const CHIP = "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm";

const rows = computed(() => rolls.data.value ?? []);
const unexposed = computed(() => rows.value.filter((row) => row.roll.status === "in_stock"));

/** Earliest expiry among unexposed rolls, which is the one to shoot first. */
const nextExpiry = computed(
  () =>
    unexposed.value
      .filter((row) => row.roll.expiryYear)
      .sort((left, right) => +expiryDate(left.roll)! - +expiryDate(right.roll)!)[0]?.roll,
);

/** Unexposed rolls per format, as on the Inventory page: "2 × 135 · 1 × 120". */
const byFormat = computed(() => {
  const counts = new Map<string, number>();
  for (const row of unexposed.value)
    counts.set(row.roll.format, (counts.get(row.roll.format) ?? 0) + 1);
  return [...counts].map(([format, count]) => `${count} × ${format}`).join(" · ");
});

/** Rolls no longer in stock: loaded, shot, at the lab or developed. */
const shot = computed(() => rows.value.length - unexposed.value.length);
</script>

<template>
  <QueryBoundary :query="detail" empty-text="Stock not found.">
    <template #default="{ data: loaded }">
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
                  Film stock
                </span>
                <span class="tracking-[0.08em] uppercase"
                  >ID: {{ loaded.stock.id.slice(0, 8) }}</span
                >
              </div>
              <div class="flex flex-wrap gap-2">
                <Button variant="outline" class="bg-card" @click="editOpen = true">
                  <IconPencil aria-hidden="true" /> Edit stock
                </Button>
                <Button
                  variant="outline"
                  class="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  @click="doDelete"
                >
                  <IconTrash aria-hidden="true" /> Delete
                </Button>
                <Button @click="addOpen = true"><IconPlus aria-hidden="true" /> Add rolls</Button>
              </div>
            </div>

            <div class="grid gap-4">
              <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">
                {{ stockName(loaded.stock) }}
              </h1>
              <div class="flex flex-wrap gap-2">
                <span :class="cn(CHIP, TYPE_TONE[loaded.stock.type])">
                  {{ FILM_TYPE_LABELS[loaded.stock.type] }} ({{ loaded.stock.process }})
                </span>
                <span
                  :class="
                    cn(
                      CHIP,
                      'border-amber-300 bg-amber-50 font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
                    )
                  "
                >
                  Box ISO {{ loaded.stock.boxIso }}
                </span>
                <span :class="cn(CHIP, PACKAGING_TONE[loaded.stock.packaging])">
                  <i class="size-1.5 rounded-full bg-current" aria-hidden="true" />
                  Packaging: {{ PACKAGING_LABELS[loaded.stock.packaging] }}
                </span>
                <span
                  v-if="loaded.stock.stockOrigin"
                  :class="cn(CHIP, 'bg-card text-muted-foreground')"
                >
                  Origin: {{ loaded.stock.stockOrigin }}
                </span>
              </div>
              <p
                v-for="warning in stockWarnings(loaded.stock)"
                :key="warning"
                class="text-sm text-amber-600"
              >
                {{ warning }}
              </p>
            </div>

            <dl class="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-3">
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Unexposed
                </dt>
                <dd class="text-lg font-semibold tabular-nums">{{ unexposed.length }}</dd>
                <dd v-if="byFormat" class="text-muted-foreground text-xs">{{ byFormat }}</dd>
              </div>
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Next expiry
                </dt>
                <dd
                  :class="
                    cn(
                      'text-lg font-semibold tabular-nums',
                      nextExpiry && isExpired(nextExpiry) ? 'text-destructive' : 'text-primary',
                      !nextExpiry && 'text-muted-foreground',
                    )
                  "
                >
                  {{ nextExpiry ? formatExpiry(nextExpiry) : "—" }}
                </dd>
              </div>
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Shot
                </dt>
                <dd class="text-lg font-semibold tabular-nums">{{ shot }}</dd>
                <dd class="text-muted-foreground text-xs">
                  of {{ rows.length }} {{ rows.length === 1 ? "roll" : "rolls" }}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <!-- attributes -->
          <div class="grid gap-6">
            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="01" title="Primary specifications">
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SpecTile label="Brand">{{ loaded.stock.brand }}</SpecTile>
                  <SpecTile label="Name">{{ loaded.stock.name }}</SpecTile>
                  <SpecTile label="Type">
                    <span
                      :class="
                        cn(
                          'inline-flex rounded-sm px-2 py-0.5 text-sm',
                          TYPE_TONE[loaded.stock.type],
                        )
                      "
                    >
                      {{ FILM_TYPE_LABELS[loaded.stock.type] }}
                    </span>
                  </SpecTile>
                  <SpecTile label="Box ISO">
                    <span
                      class="inline-flex rounded-sm border border-amber-300 bg-amber-50 px-2 py-0.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
                    >
                      ISO {{ loaded.stock.boxIso }}
                    </span>
                  </SpecTile>
                </div>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="02" title="Provenance & notes">
                <div class="grid gap-3 sm:grid-cols-2">
                  <SpecTile label="Stock origin">
                    <span
                      :class="{ 'text-muted-foreground font-normal': !loaded.stock.stockOrigin }"
                    >
                      {{ loaded.stock.stockOrigin || "Not set" }}
                    </span>
                  </SpecTile>
                  <SpecTile label="Pack origin">
                    <span
                      :class="{ 'text-muted-foreground font-normal': !loaded.stock.packOrigin }"
                    >
                      {{ loaded.stock.packOrigin || "Not set" }}
                    </span>
                  </SpecTile>
                </div>
                <div class="grid gap-2">
                  <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                    Darkroom notes &amp; characteristics
                  </span>
                  <RichText
                    v-if="loaded.stock.description"
                    :markdown="loaded.stock.description"
                    class="bg-background/60 rounded-lg border p-4 text-sm"
                  />
                  <p
                    v-else
                    class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm"
                  >
                    No notes yet.
                  </p>
                </div>
              </FormSection>
            </div>
          </div>

          <!-- rolls and related stocks -->
          <aside class="grid gap-6">
            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="REL" title="Same emulsion">
                <p
                  v-if="!loaded.base && !loaded.siblings.length && !loaded.children.length"
                  class="text-muted-foreground text-sm"
                >
                  No base stock and no stocks based on this one.
                </p>
                <dl v-else class="grid gap-3 text-sm">
                  <div v-if="loaded.base" class="grid gap-1">
                    <dt class="text-muted-foreground text-xs">Base</dt>
                    <dd>
                      <Link
                        to="/app/stocks/$stockId"
                        :params="{ stockId: loaded.base.id }"
                        class="font-medium hover:underline"
                      >
                        {{ stockName(loaded.base) }}
                      </Link>
                    </dd>
                  </div>
                  <div v-if="loaded.siblings.length" class="grid gap-1">
                    <dt class="text-muted-foreground text-xs">Also based on it</dt>
                    <dd class="flex flex-wrap gap-x-3 gap-y-1">
                      <Link
                        v-for="stock in loaded.siblings"
                        :key="stock.id"
                        to="/app/stocks/$stockId"
                        :params="{ stockId: stock.id }"
                        class="font-medium hover:underline"
                      >
                        {{ stockName(stock) }}
                      </Link>
                    </dd>
                  </div>
                  <div v-if="loaded.children.length" class="grid gap-1">
                    <dt class="text-muted-foreground text-xs">Repacked as</dt>
                    <dd class="flex flex-wrap gap-x-3 gap-y-1">
                      <Link
                        v-for="stock in loaded.children"
                        :key="stock.id"
                        to="/app/stocks/$stockId"
                        :params="{ stockId: stock.id }"
                        class="font-medium hover:underline"
                      >
                        {{ stockName(stock) }}
                      </Link>
                    </dd>
                  </div>
                </dl>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="LOG" :title="`Rolls (${rows.length})`">
                <div v-if="rows.length" class="grid max-h-96 gap-2 overflow-y-auto">
                  <Link
                    v-for="row in rows"
                    :key="row.roll.id"
                    to="/app/rolls/$rollId"
                    :params="{ rollId: row.roll.id }"
                    class="hover:bg-accent/40 group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <span class="grid gap-0.5">
                      <span class="font-medium">
                        {{ row.roll.format }} · {{ row.roll.exposures }} exp
                      </span>
                      <span class="text-muted-foreground text-xs">
                        Exp: {{ formatExpiry(row.roll) }}
                      </span>
                    </span>
                    <span class="flex items-center gap-2">
                      <RollStatusBadge :status="row.roll.status" />
                      <IconChevronRight
                        class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </div>
                <p v-else class="text-muted-foreground text-sm">No rolls of this stock yet.</p>
              </FormSection>
            </div>
          </aside>
        </div>
      </div>

      <StockFormDialog v-model:open="editOpen" :stock-id="loaded.stock.id" />
      <AddRollsDialog v-model:open="addOpen" :stock-id="loaded.stock.id" />
    </template>
  </QueryBoundary>
</template>

<script setup lang="ts">
import { formatDate, formatVnd } from "#/shared/lib/format";
import { useDeleteJob } from "../queries";
import { PROCESSING_TYPE_LABELS, producesScans, recordsNegativesReturned } from "../types";
import type { RollJob, RollRow } from "../types";
import type { Process } from "#/features/film-stocks/types";
import { Link } from "@tanstack/vue-router";
import { computed, ref } from "vue";
import EmptyState from "#/shared/components/EmptyState.vue";
import { RichText } from "#/shared/components/richText";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";
import SendToLabDialog from "./SendToLabDialog.vue";
import {
  optionsForKind,
  settingsParts,
  useScannerKinds,
  useScannerList,
} from "#/features/scanners";

const props = defineProps<{
  row: RollRow;
  jobs: RollJob[];
  process?: Process;
  finishedOn?: string | null;
}>();

const rollId = () => props.row.roll.id;

const scanners = useScannerList();
const kinds = useScannerKinds();
/** Options of an ordered scanner's kind, to word its settings. */
const optionsOfScanner = (scannerId: string) =>
  optionsForKind(
    kinds.data.value,
    scanners.data.value?.find((scanner) => scanner.id === scannerId)?.kind,
  );

/** Latest job first. ISO dates compare as strings; jobs sent the same day keep the later one on
 * top. */
const newestFirst = computed(() =>
  props.jobs
    .map((job, index) => ({ job, index }))
    .sort(
      (left, right) =>
        right.job.sentDate.localeCompare(left.job.sentDate) || right.index - left.index,
    )
    .map(({ job }) => job),
);
const deleteJob = useDeleteJob();

const editing = ref<RollJob>();
const editOpen = ref(false);

function edit(job: RollJob) {
  editing.value = job;
  editOpen.value = true;
}

async function remove(job: RollJob) {
  if (await ask("Delete this processing job?"))
    await attempt(deleteJob.mutateAsync({ rollId: rollId(), jobId: job.id }));
}

/** The service, the process and the price, as one line under the lab. */
const jobSummary = (job: RollJob) =>
  [
    PROCESSING_TYPE_LABELS[job.type],
    job.process,
    job.price == null ? undefined : formatVnd(job.price),
  ]
    .filter(Boolean)
    .join(" · ");

type Tone = "done" | "late" | "overdue" | "due" | "pending";

interface Step {
  label: string;
  /** Absent when no date is ever expected: sending the roll, or work done at home. */
  expected?: string | null;
  actual: string | null;
  status: { text: string; tone: Tone };
}

const today = () => new Date().toLocaleDateString("en-CA");

/** Whole days from one ISO date to another; read as UTC days so DST cannot shift them. */
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

const plural = (count: number) => `${count} day${count === 1 ? "" : "s"}`;

/** Where a step stands: done (on time or late), or still waiting (overdue, due, no date). */
function statusOf(expected: string | null, actual: string | null): Step["status"] {
  if (actual) {
    const late = expected ? daysBetween(expected, actual) : 0;
    return late > 0
      ? { text: `${plural(late)} late`, tone: "late" }
      : { text: "Done", tone: "done" };
  }
  if (!expected) return { text: "Waiting", tone: "pending" };
  const left = daysBetween(today(), expected);
  if (left < 0) return { text: `Overdue ${plural(-left)}`, tone: "overdue" };
  return { text: left ? `Due in ${plural(left)}` : "Due today", tone: "due" };
}

const TONE_CLASSES: Record<Tone, string> = {
  done: "text-emerald-700 dark:text-emerald-400",
  late: "text-amber-700 dark:text-amber-400",
  overdue: "text-destructive font-medium",
  due: "text-foreground",
  pending: "text-muted-foreground",
};

/**
 * The job's steps in order: the roll goes out, then the negatives (or prints) and the scans come
 * back. Negatives come back from developing, printing or a lab scan. A lab step always has an
 * expected cell, so a date not set yet still shows; work at home has none.
 */
function jobSteps(job: RollJob): Step[] {
  const atLab = !!job.labId;
  const steps: Step[] = [
    {
      label: atLab ? "Sent" : "Started",
      actual: job.sentDate,
      status: { text: "Done", tone: "done" },
    },
  ];
  if (recordsNegativesReturned(job.type, atLab) || job.negativesExpectedDate)
    steps.push({
      label: !atLab && job.type === "print" ? "Prints" : atLab ? "Negatives back" : "Negatives",
      expected: atLab ? job.negativesExpectedDate : undefined,
      actual: job.negativesReturnedDate,
      // negatives can come back with the scans, so a later return is not counted as late
      status: job.negativesReturnedDate
        ? { text: "Done", tone: "done" }
        : statusOf(job.negativesExpectedDate, null),
    });
  if (producesScans(job.type))
    steps.push({
      label: atLab ? "Scans back" : "Scans",
      expected: atLab ? job.scansExpectedDate : undefined,
      actual: job.scansReceivedDate,
      status: statusOf(job.scansExpectedDate, job.scansReceivedDate),
    });
  return steps;
}
</script>

<template>
  <EmptyState v-if="!jobs.length" text="Not sent for processing yet." />
  <ul v-else class="grid gap-3">
    <li
      v-for="job in newestFirst"
      :key="job.id"
      class="grid min-w-0 gap-5 rounded-lg border p-4 sm:p-5"
    >
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-base leading-snug font-semibold text-balance">{{ job.labName }}</p>
          <p class="text-muted-foreground mt-0.5 text-sm">{{ jobSummary(job) }}</p>
          <Link
            v-if="job.order"
            to="/app/orders/$orderId"
            :params="{ orderId: job.order.id }"
            class="text-primary mt-0.5 block text-sm underline-offset-2 hover:underline"
          >
            Order #{{ job.order.code }} · {{ job.order.product }}
          </Link>
        </div>
        <Badge :variant="job.open ? 'destructive' : 'secondary'" class="shrink-0">
          {{ job.open ? "Open" : "Closed" }}
        </Badge>
      </header>

      <section class="grid gap-2" aria-label="Dates">
        <h4 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Dates</h4>
        <div class="overflow-x-auto rounded-md border">
          <!-- fixed widths keep every job's columns in line, filled in or not -->
          <table class="w-full min-w-[36rem] table-fixed text-sm">
            <colgroup>
              <col />
              <col class="w-32" />
              <col class="w-32" />
              <col class="w-40" />
            </colgroup>
            <thead class="bg-muted/50">
              <tr class="text-muted-foreground text-left text-xs">
                <th scope="col" class="px-3 py-2 font-medium">Step</th>
                <th scope="col" class="px-3 py-2 font-medium">Expected</th>
                <th scope="col" class="px-3 py-2 font-medium">Actual</th>
                <th scope="col" class="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y border-t">
              <tr v-for="step in jobSteps(job)" :key="step.label">
                <th scope="row" class="px-3 py-2.5 text-left font-medium">{{ step.label }}</th>
                <td
                  class="px-3 py-2.5 tabular-nums"
                  :class="!step.expected && 'text-muted-foreground'"
                >
                  {{ formatDate(step.expected) }}
                </td>
                <td
                  class="px-3 py-2.5 tabular-nums"
                  :class="!step.actual && 'text-muted-foreground'"
                >
                  {{ formatDate(step.actual) }}
                </td>
                <td class="px-3 py-2.5" :class="TONE_CLASSES[step.status.tone]">
                  <span class="inline-flex items-center gap-2">
                    <span class="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                    {{ step.status.text }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="job.scanOrders.length" class="grid gap-2" aria-label="Scans">
        <h4 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Scans</h4>
        <ul class="divide-y rounded-md border">
          <li
            v-for="order in job.scanOrders"
            :key="order.scannerId"
            class="grid gap-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-center sm:gap-4"
          >
            <span class="text-sm font-medium">{{ order.scannerName }}</span>
            <span class="flex flex-wrap gap-1.5">
              <span
                v-for="part in settingsParts(order.settings, optionsOfScanner(order.scannerId))"
                :key="part"
                class="bg-muted rounded px-1.5 py-0.5 text-xs"
              >
                {{ part }}
              </span>
              <span
                v-if="!settingsParts(order.settings, optionsOfScanner(order.scannerId)).length"
                class="text-muted-foreground text-xs"
              >
                Default settings
              </span>
            </span>
          </li>
        </ul>
      </section>

      <section v-if="job.notes" class="grid gap-2" aria-label="Notes">
        <h4 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Notes</h4>
        <RichText :markdown="job.notes" class="text-sm leading-relaxed" />
      </section>

      <footer class="flex justify-end gap-2 border-t pt-3">
        <Button type="button" size="sm" variant="outline" @click="edit(job)">Edit</Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          class="text-destructive hover:text-destructive"
          @click="remove(job)"
        >
          Delete
        </Button>
      </footer>
    </li>
  </ul>
  <SendToLabDialog
    v-model:open="editOpen"
    :row="row"
    :job="editing"
    :process="process"
    :finished-on="finishedOn"
  />
</template>

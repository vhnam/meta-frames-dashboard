<script setup lang="ts">
import { formatVnd } from "#/shared/lib/format";
import { useDeleteJob } from "../queries";
import { PROCESSING_TYPE_LABELS, SCANNER_LABELS, developsFilm } from "../types";
import type { RollJob, RollRow } from "../types";
import type { Process } from "#/features/film-stocks/types";
import { ref } from "vue";
import EmptyState from "#/shared/components/EmptyState.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/shared/ui/table";
import { ask, attempt } from "#/shared/lib/ui";
import SendToLabDialog from "./SendToLabDialog.vue";

const props = defineProps<{
  row: RollRow;
  jobs: RollJob[];
  process?: Process;
  finishedOn?: string | null;
}>();

const rollId = () => props.row.roll.id;
const deleteJob = useDeleteJob();

const editing = ref<RollJob>();
const editOpen = ref(false);

function edit(job: RollJob) {
  editing.value = job;
  editOpen.value = true;
}

async function remove(job: RollJob) {
  if (ask("Delete this processing job?"))
    await attempt(deleteJob.mutateAsync({ rollId: rollId(), jobId: job.id }));
}

/** ISO dates compare as strings. */
const isOverdue = (job: RollJob) =>
  !job.scansReceivedDate &&
  !!job.scansExpectedDate &&
  job.scansExpectedDate < new Date().toLocaleDateString("en-CA");

const isNegativesOverdue = (job: RollJob) =>
  !job.negativesReturnedDate &&
  !!job.negativesExpectedDate &&
  job.negativesExpectedDate < new Date().toLocaleDateString("en-CA");

function jobFacts(job: RollJob) {
  return [
    { label: "Type", value: PROCESSING_TYPE_LABELS[job.type] },
    { label: "Process", value: job.process },
    { label: "Sent", value: job.sentDate },
    // a scanning job always shows when its scans are due, even before a date is set
    ...(job.scanOrders.length || job.scansExpectedDate
      ? [
          {
            label: "Scans expected",
            value: job.scansExpectedDate ?? "—",
            overdue: isOverdue(job),
          },
        ]
      : []),
    // a lab that develops keeps the negatives until they are returned: show when they are due
    ...((developsFilm(job.type) && job.labId) || job.negativesExpectedDate
      ? [
          {
            label: "Negatives expected",
            value: job.negativesExpectedDate ?? "—",
            overdue: isNegativesOverdue(job),
          },
        ]
      : []),
    { label: "Scans received", value: job.scansReceivedDate ?? "—" },
    { label: "Negatives returned", value: job.negativesReturnedDate ?? "—" },
  ];
}
</script>

<template>
  <EmptyState v-if="!jobs.length" text="Not sent for processing yet." />
  <ul v-else class="grid gap-3">
    <li v-for="j in jobs" :key="j.id" class="grid gap-4 rounded-lg border p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-base leading-snug font-semibold text-balance">{{ j.labName }}</p>
          <p
            v-if="j.notes"
            class="text-muted-foreground mt-1 line-clamp-3 text-sm leading-relaxed whitespace-pre-line"
          >
            {{ j.notes }}
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-1">
          <Badge :variant="j.open ? 'destructive' : 'secondary'">
            {{ j.open ? "Open" : "Closed" }}
          </Badge>
          <p class="text-sm font-semibold tabular-nums">{{ formatVnd(j.price) }}</p>
        </div>
      </div>

      <div class="grid items-start gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <p class="bg-muted rounded-md px-2 py-1 text-sm font-semibold">Processing</p>
          <Table>
            <TableBody>
              <TableRow v-for="fact in jobFacts(j)" :key="fact.label" class="hover:bg-transparent">
                <TableHead
                  scope="row"
                  class="text-muted-foreground h-auto px-2 py-1.5 text-left text-sm font-normal whitespace-normal"
                >
                  {{ fact.label }}
                </TableHead>
                <TableCell
                  class="px-2 py-1.5 tabular-nums"
                  :class="fact.overdue && 'text-destructive font-medium'"
                >
                  {{ fact.value }}
                  <span v-if="fact.overdue" class="text-xs">(overdue)</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="grid gap-2">
          <p class="bg-muted rounded-md px-2 py-1 text-sm font-semibold">Scans</p>
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="h-8 px-2">Scanner</TableHead>
                <TableHead class="h-8 px-2">Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="!j.scanOrders.length" class="hover:bg-transparent">
                <TableCell colspan="2" class="text-muted-foreground px-2 py-1.5">None</TableCell>
              </TableRow>
              <TableRow v-for="o in j.scanOrders" :key="o.scanner" class="hover:bg-transparent">
                <TableCell class="px-2 py-1.5 whitespace-normal">
                  {{ SCANNER_LABELS[o.scanner] }}
                </TableCell>
                <TableCell class="px-2 py-1.5">{{ o.hiRes ? "Hi-res" : "Standard" }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t pt-3">
        <Button type="button" size="sm" variant="outline" @click="edit(j)">Edit</Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          class="text-destructive hover:text-destructive"
          @click="remove(j)"
        >
          Delete
        </Button>
      </div>
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

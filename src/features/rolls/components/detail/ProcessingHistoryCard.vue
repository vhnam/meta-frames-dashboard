<script setup lang="ts">
import type { Process } from "#/features/film-stocks/types";
import { useFinishRoll } from "../../queries";
import { sendableTypes } from "../../types";
import type { RollJob, RollRow } from "../../types";
import { computed, ref } from "vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { attempt } from "#/shared/lib/ui";
import { formatDate } from "#/shared/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";
import ProcessingJobs from "../ProcessingJobs.vue";
import SendToLabDialog from "../SendToLabDialog.vue";

const props = defineProps<{
  row: RollRow;
  jobs: RollJob[];
  process?: Process;
  finishedOn?: string | null;
}>();

const sendOpen = ref(false);
const rescanOpen = ref(false);
const finishRoll = useFinishRoll();
const types = computed(() => sendableTypes(props.row.roll.status, props.jobs.length));
/** Once the roll has been processed, scanning it again is the only action left; prints are not
 * offered after the first job. */
const canRescan = computed(() => props.jobs.length > 0 && types.value.includes("scan"));
const canSend = computed(() => !props.jobs.length && types.value.length > 0);
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="flex items-center gap-2">
        Processing history
        <Badge v-if="jobs.length" variant="secondary">{{ jobs.length }}</Badge>
      </CardTitle>
      <div class="flex gap-2">
        <Button
          v-if="row.roll.status === 'in_camera'"
          type="button"
          size="sm"
          :disabled="finishRoll.isPending.value"
          @click="attempt(finishRoll.mutateAsync(row.roll.id))"
        >
          Mark as finished
        </Button>
        <Button v-if="canRescan" type="button" size="sm" @click="rescanOpen = true">
          Re-scan
        </Button>
        <Button v-if="canSend" type="button" size="sm" @click="sendOpen = true">
          Send to lab
        </Button>
      </div>
    </CardHeader>
    <CardContent class="grid gap-3 text-sm">
      <dl v-if="finishedOn" class="grid grid-cols-[auto_1fr] gap-x-3">
        <dt class="text-muted-foreground">Finished</dt>
        <dd class="tabular-nums">{{ formatDate(finishedOn) }}</dd>
      </dl>
      <ProcessingJobs :row="row" :jobs="jobs" :process="process" :finished-on="finishedOn" />
    </CardContent>
    <SendToLabDialog
      v-model:open="sendOpen"
      :row="row"
      :process="process"
      :finished-on="finishedOn"
      :types="types"
    />
    <SendToLabDialog
      v-model:open="rescanOpen"
      :row="row"
      :process="process"
      :finished-on="finishedOn"
      :types="['scan']"
      rescan
    />
  </Card>
</template>

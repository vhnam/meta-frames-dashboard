<script setup lang="ts">
import { startingSettings, useScannerKinds, useScannerList } from "#/features/scanners";
import { useSendToLab, useSetScanRequest } from "../../queries";
import {
  canMarkDeveloped,
  canStartHomeDevelop,
  canStartHomeScan,
  developingJob,
  sendableTypes,
} from "../../types";
import type { ProcessingType, RollDetail, RollRow } from "../../types";
import { computed, ref } from "vue";
import { Button } from "#/shared/ui/button";
import { formatDate } from "#/shared/lib/format";
import { notify } from "#/shared/lib/toast";
import { attempt } from "#/shared/lib/ui";
import FormSection from "#/shared/components/FormSection.vue";
import FinishRollDialog from "../FinishRollDialog.vue";
import MarkDevelopedDialog from "../MarkDevelopedDialog.vue";
import ProcessingJobs from "../ProcessingJobs.vue";
import ReturnNegativesDialog from "../ReturnNegativesDialog.vue";
import RollPlanFields from "../RollPlanFields.vue";
import SendToLabDialog from "../SendToLabDialog.vue";

const props = defineProps<{ row: RollRow; detail: RollDetail }>();

const roll = computed(() => props.detail.roll);
const jobs = computed(() => props.detail.jobs);
const process = computed(() => props.detail.stock.process);
const finishedOn = computed(() => roll.value.finishDate);

const sendOpen = ref(false);
const rescanOpen = ref(false);
const finishOpen = ref(false);
const developedOpen = ref(false);
const returnOpen = ref(false);
const types = computed(() => sendableTypes(roll.value.status, jobs.value.length));
/** Once the roll has been processed, scanning it again is the only action left; prints are not
 * offered after the first job. */
const canRescan = computed(() => jobs.value.length > 0 && types.value.includes("scan"));
const canSend = computed(() => !jobs.value.length && types.value.length > 0);
const canStartDeveloping = computed(() =>
  canStartHomeDevelop(roll.value.status, jobs.value, props.detail.negativesAtLab),
);
const markable = computed(() =>
  canMarkDeveloped(roll.value.status, jobs.value, props.detail.negativesAtLab),
);
const developedMin = computed(() => developingJob(jobs.value)?.sentDate ?? finishedOn.value);
const homeScannable = computed(() =>
  canStartHomeScan(roll.value.status, props.detail.stageDetail, props.detail.needsScan),
);

const sendToLab = useSendToLab();
const setScanRequest = useSetScanRequest();
const scanners = useScannerList();
const kinds = useScannerKinds();
const today = () => new Date().toLocaleDateString("en-CA");

/** A home job starts today and stays open until its result is recorded. */
function startAtHome(type: ProcessingType) {
  const ownScanner = scanners.data.value?.find((scanner) => !scanner.builtIn);
  if (type === "scan" && !ownScanner) {
    notify.error("Add your own scanner on the Scanners page first.");
    return;
  }
  return attempt(
    sendToLab.mutateAsync({
      rollId: roll.value.id,
      input: {
        type,
        process: process.value,
        sentAt: today(),
        scanOrders:
          ownScanner && type === "scan"
            ? [
                {
                  scannerId: ownScanner.id,
                  // without the kinds, the scanner's own preset rather than nothing
                  settings: kinds.data.value
                    ? startingSettings(kinds.data.value, ownScanner)
                    : ownScanner.defaultSettings,
                },
              ]
            : [],
      },
    }),
  );
}

const toggleScanMark = () =>
  attempt(setScanRequest.mutateAsync({ rollId: roll.value.id, needed: !props.detail.needsScan }));
</script>

<template>
  <div class="bg-card rounded-xl border p-6 shadow-sm">
    <FormSection
      no="03"
      :title="jobs.length ? `Processing history (${jobs.length})` : 'Processing history'"
    >
      <template #actions>
        <div class="flex flex-wrap justify-end gap-2">
          <Button
            v-if="roll.status === 'in_camera'"
            type="button"
            size="sm"
            @click="finishOpen = true"
          >
            Mark as finished
          </Button>
          <Button
            v-if="canStartDeveloping"
            type="button"
            size="sm"
            variant="outline"
            :disabled="sendToLab.isPending.value"
            @click="startAtHome('develop')"
          >
            Start developing at home
          </Button>
          <Button v-if="markable" type="button" size="sm" @click="developedOpen = true">
            Mark as developed
          </Button>
          <Button
            v-if="homeScannable"
            type="button"
            size="sm"
            variant="outline"
            :disabled="
              sendToLab.isPending.value || scanners.isPending.value || detail.negativesAtLab
            "
            :title="detail.negativesAtLab ? 'A lab still holds the negatives.' : undefined"
            @click="startAtHome('scan')"
          >
            Start scanning at home
          </Button>
          <Button
            v-if="detail.openHandoffId"
            type="button"
            size="sm"
            variant="outline"
            @click="returnOpen = true"
          >
            Negatives returned
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            :disabled="setScanRequest.isPending.value"
            @click="toggleScanMark"
          >
            {{ detail.needsScan ? "Remove needs scan" : "Needs scan" }}
          </Button>
          <Button v-if="canRescan" type="button" size="sm" @click="rescanOpen = true">
            Re-scan
          </Button>
          <Button v-if="canSend" type="button" size="sm" @click="sendOpen = true">
            Send to lab
          </Button>
        </div>
      </template>
      <div class="grid gap-4 text-sm">
        <section class="grid gap-2" aria-label="Plan">
          <h4 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Plan</h4>
          <RollPlanFields :roll-id="roll.id" :plan="detail.plan" />
        </section>
        <dl v-if="finishedOn" class="grid grid-cols-[auto_1fr] gap-x-3">
          <dt class="text-muted-foreground">Finished</dt>
          <dd class="tabular-nums">{{ formatDate(finishedOn) }}</dd>
        </dl>
        <ProcessingJobs :row="row" :jobs="jobs" :process="process" :finished-on="finishedOn" />
      </div>
    </FormSection>
    <FinishRollDialog v-model:open="finishOpen" :row="row" />
    <MarkDevelopedDialog
      v-model:open="developedOpen"
      :roll-id="roll.id"
      :target="detail.plan.target"
      :min="developedMin"
    />
    <ReturnNegativesDialog
      v-if="detail.openHandoffId"
      v-model:open="returnOpen"
      :roll-id="roll.id"
      :handoff-id="detail.openHandoffId"
    />
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
  </div>
</template>

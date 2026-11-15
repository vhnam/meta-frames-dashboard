<script setup lang="ts">
import { IconChevronDown } from '@tabler/icons-vue';
import { computed, ref } from 'vue';

import { startingSettings, useScannerKinds, useScannerList } from '#/features/scanners';
import FormSection from '#/shared/components/FormSection.vue';
import { formatDate } from '#/shared/lib/format';
import { notify } from '#/shared/lib/toast';
import { attempt } from '#/shared/lib/ui';
import { Button } from '#/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/shared/ui/dropdown-menu';

import { useSendToLab, useSetScanRequest } from '../../queries';
import {
  canMarkDeveloped,
  canStartHomeDevelop,
  canStartHomeScan,
  developingJob,
  sendableTypes,
} from '../../types';
import type { ProcessingType, RollDetail, RollRow } from '../../types';
import FinishRollDialog from '../FinishRollDialog.vue';
import MarkDevelopedDialog from '../MarkDevelopedDialog.vue';
import ProcessingJobs from '../ProcessingJobs.vue';
import ReturnNegativesDialog from '../ReturnNegativesDialog.vue';
import RollPlanFields from '../RollPlanFields.vue';
import SendToLabDialog from '../SendToLabDialog.vue';

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
const canRescan = computed(() => jobs.value.length > 0 && types.value.includes('scan'));
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
const today = () => new Date().toLocaleDateString('en-CA');

/** A home job starts today and stays open until its result is recorded. */
function startAtHome(type: ProcessingType) {
  const ownScanner = scanners.data.value?.find((scanner) => !scanner.builtIn);
  if (type === 'scan' && !ownScanner) {
    notify.error('Add your own scanner on the Scanners page first.');
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
          ownScanner && type === 'scan'
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
  <div class="rounded-xl border bg-card p-6 shadow-sm">
    <FormSection
      no="03"
      :title="jobs.length ? `Processing history (${jobs.length})` : 'Processing history'"
    >
      <template #actions>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              type="button"
              size="sm"
            >
              Actions
              <IconChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            class="min-w-56"
          >
            <DropdownMenuItem
              v-if="roll.status === 'in_camera'"
              @select="finishOpen = true"
            >
              Mark as finished
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="canStartDeveloping"
              :disabled="sendToLab.isPending.value"
              @select="startAtHome('develop')"
            >
              Start developing at home
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="markable"
              @select="developedOpen = true"
            >
              Mark as developed
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="homeScannable"
              :disabled="
                sendToLab.isPending.value || scanners.isPending.value || detail.negativesAtLab
              "
              class="flex-col items-start gap-0.5"
              @select="startAtHome('scan')"
            >
              Start scanning at home
              <span
                v-if="detail.negativesAtLab"
                class="text-xs text-muted-foreground"
              >
                A lab still holds the negatives.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="detail.openHandoffId"
              @select="returnOpen = true"
            >
              Negatives returned
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="canRescan"
              @select="rescanOpen = true"
              >Re-scan</DropdownMenuItem
            >
            <DropdownMenuItem
              v-if="canSend"
              @select="sendOpen = true"
              >Send to lab</DropdownMenuItem
            >
            <DropdownMenuSeparator />
            <DropdownMenuItem
              :disabled="setScanRequest.isPending.value"
              @select="toggleScanMark"
            >
              {{ detail.needsScan ? 'Remove needs scan' : 'Needs scan' }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
      <div class="grid gap-4 text-sm">
        <section
          class="grid gap-2"
          aria-label="Plan"
        >
          <h4 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Plan</h4>
          <RollPlanFields
            :roll-id="roll.id"
            :plan="detail.plan"
          />
        </section>
        <dl
          v-if="finishedOn"
          class="grid grid-cols-[auto_1fr] gap-x-3"
        >
          <dt class="text-muted-foreground">Finished</dt>
          <dd class="tabular-nums">{{ formatDate(finishedOn) }}</dd>
        </dl>
        <ProcessingJobs
          :row="row"
          :jobs="jobs"
          :process="process"
          :finished-on="finishedOn"
        />
      </div>
    </FormSection>
    <FinishRollDialog
      v-model:open="finishOpen"
      :row="row"
    />
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

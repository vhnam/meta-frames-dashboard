<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { RollJob } from "#/features/rolls";
import { useScannerList } from "#/features/scanners";
import PlainDialog from "#/shared/components/PlainDialog.vue";
import Select from "#/shared/components/Select.vue";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";
import { useImportScans, usePreviewImport } from "../queries";
import type { ImportPreviewItem, ImportResult, NumberingMode, OnConflict } from "../types";

const props = defineProps<{ job: RollJob }>();
const open = defineModel<boolean>("open", { required: true });

const preview = usePreviewImport();
const importing = useImportScans();
const allScanners = useScannerList();

/** The scanners ordered on this job; any scanner when the job lists none. */
const scannerOptions = computed(() =>
  props.job.scanOrders.length
    ? props.job.scanOrders.map((order) => ({ value: order.scannerId, label: order.scannerName }))
    : (allScanners.data.value ?? []).map((scanner) => ({ value: scanner.id, label: scanner.name })),
);

const scannerId = ref("");
const onConflict = ref<OnConflict>("skip");
const mode = ref<NumberingMode>("names");
const startFrame = ref(1);
const offset = ref(0);
const files = ref<File[]>([]);
/** The frame number for each file, by position; "" leaves the file out. */
const numbers = ref<(string | number)[]>([]);
const items = ref<ImportPreviewItem[]>([]);
const result = ref<ImportResult>();

watch(open, (isOpen) => {
  if (!isOpen) return;
  scannerId.value = scannerOptions.value.length === 1 ? scannerOptions.value[0].value : "";
  onConflict.value = "skip";
  mode.value = "names";
  startFrame.value = 1;
  offset.value = 0;
  files.value = [];
  numbers.value = [];
  items.value = [];
  result.value = undefined;
});

function pick(event: Event) {
  files.value = [...((event.target as HTMLInputElement).files ?? [])];
  numbers.value = files.value.map(() => "");
  items.value = [];
  result.value = undefined;
}

async function runPreview() {
  const picked = files.value;
  if (!picked.length) return;
  try {
    const previewed = await preview.mutateAsync({
      jobId: props.job.id,
      fileNames: picked.map((file) => file.name),
      mode: mode.value,
      startFrame: Number(startFrame.value) || 0,
      offset: Number(offset.value) || 0,
    });
    if (files.value !== picked) return; // another file set was chosen meanwhile
    items.value = previewed;
    numbers.value = previewed.map((item) =>
      item.frameNumber === undefined ? "" : String(item.frameNumber),
    );
  } catch {
    if (files.value === picked) items.value = [];
  }
}

/** Files with a valid frame number; the rest are left out of the import. */
const entries = computed(() =>
  files.value.flatMap((file, index) => {
    const text = String(numbers.value[index] ?? "").trim();
    const frameNumber = Number(text);
    return text && Number.isInteger(frameNumber) && frameNumber >= 0 ? [{ file, frameNumber }] : [];
  }),
);
const canImport = computed(() => !!scannerId.value && entries.value.length > 0);

async function submit() {
  if (!canImport.value) return;
  try {
    result.value = await importing.mutateAsync({
      jobId: props.job.id,
      scannerId: scannerId.value,
      onConflict: onConflict.value,
      entries: entries.value,
    });
  } catch {
    // the failure is already toasted; the choices stay for another try
  }
}

const label = "text-sm font-medium";
</script>

<template>
  <PlainDialog
    v-model:open="open"
    title="Import scans"
    description="Choose the scan files, check which frame each belongs to, then import"
    submit-label="Import"
    wide
    @submit="submit"
  >
    <div class="grid gap-4">
      <div class="grid gap-1.5">
        <Label :class="label" for="import-scanner">Scanner</Label>
        <Select
          id="import-scanner"
          v-model="scannerId"
          :options="scannerOptions"
          placeholder="Choose the scanner"
          :allow-empty="false"
        />
      </div>

      <div class="grid gap-1.5">
        <Label :class="label" for="import-files">Scan files</Label>
        <input
          id="import-files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/tiff,.jpg,.jpeg,.png,.webp,.tif,.tiff"
          class="text-sm"
          @change="pick"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="grid gap-1.5">
          <Label :class="label" for="import-mode">Frame numbers</Label>
          <Select
            id="import-mode"
            v-model="mode"
            :options="[
              { value: 'names', label: 'Read from file names' },
              { value: 'sequential', label: 'Count from a start frame' },
            ]"
            :allow-empty="false"
          />
        </div>
        <div v-if="mode === 'sequential'" class="grid gap-1.5">
          <Label :class="label" for="import-start">Start frame</Label>
          <Input id="import-start" v-model="startFrame" type="number" min="0" />
        </div>
        <div v-else class="grid gap-1.5">
          <Label :class="label" for="import-offset">Shift numbers by</Label>
          <Input id="import-offset" v-model="offset" type="number" />
        </div>
        <div class="grid gap-1.5">
          <Label :class="label" for="import-conflict">If a frame already has a scan</Label>
          <Select
            id="import-conflict"
            v-model="onConflict"
            :options="[
              { value: 'skip', label: 'Keep the existing scan' },
              { value: 'replace', label: 'Replace it' },
            ]"
            :allow-empty="false"
          />
        </div>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="!files.length || preview.isPending.value"
          @click="runPreview"
        >
          Preview frame numbers
        </Button>
      </div>

      <table v-if="files.length" class="w-full text-sm" aria-label="Files to import">
        <thead>
          <tr class="text-muted-foreground text-left text-xs">
            <th scope="col" class="py-1 font-medium">File</th>
            <th scope="col" class="w-28 py-1 font-medium">Frame</th>
            <th scope="col" class="py-1 font-medium">Note</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="(file, index) in files" :key="`${index}-${file.name}`">
            <td class="py-1.5 break-all">{{ file.name }}</td>
            <td class="py-1.5">
              <Input
                v-model="numbers[index]"
                type="number"
                min="0"
                :aria-label="`Frame number of ${file.name}`"
              />
            </td>
            <td class="text-destructive py-1.5 text-xs">{{ items[index]?.error }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="files.length" class="text-muted-foreground text-xs">
        {{ entries.length }} of {{ files.length }} files will be imported. A file with no frame
        number is left out.
      </p>

      <section v-if="result" class="grid gap-1 rounded-md border p-3 text-sm" aria-label="Result">
        <p class="font-medium">
          Imported {{ result.imported.length }}, skipped {{ result.skipped.length }}, failed
          {{ result.failed.length }}
        </p>
        <ul v-if="result.skipped.length || result.failed.length" class="grid gap-0.5 text-xs">
          <li v-for="item in result.skipped" :key="`s-${item.fileName}`">
            Skipped {{ item.fileName }}: {{ item.reason }}
          </li>
          <li v-for="item in result.failed" :key="`f-${item.fileName}`" class="text-destructive">
            Failed {{ item.fileName }}: {{ item.reason }}
          </li>
        </ul>
      </section>
    </div>
  </PlainDialog>
</template>

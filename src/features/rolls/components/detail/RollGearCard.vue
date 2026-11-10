<script setup lang="ts">
import { cameraName } from "#/features/cameras";
import { lensName } from "#/features/lenses";
import type { RollDetail } from "../../types";
import { IconAperture, IconChevronRight } from "@tabler/icons-vue";
import { Link } from "@tanstack/vue-router";
import FormSection from "#/shared/components/FormSection.vue";
import { Button } from "#/shared/ui/button";

defineProps<{ detail: RollDetail }>();
defineEmits<{ manageLenses: []; load: [] }>();

/** A linked row, as on the camera and lens detail pages. */
const ROW =
  "hover:bg-accent/40 group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm";
</script>

<template>
  <div class="bg-card rounded-xl border p-6 shadow-sm">
    <FormSection no="02" title="Camera & lenses">
      <template v-if="detail.roll.status === 'in_stock' || detail.camera" #actions>
        <Button
          v-if="detail.roll.status === 'in_stock'"
          type="button"
          size="sm"
          @click="$emit('load')"
        >
          Load into camera
        </Button>
        <Button
          v-if="detail.camera && !detail.camera.fixedLens"
          type="button"
          variant="outline"
          size="xs"
          @click="$emit('manageLenses')"
        >
          <IconAperture aria-hidden="true" /> Manage lenses
        </Button>
      </template>

      <p
        v-if="!detail.camera"
        class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm"
      >
        Not loaded into a camera yet.
      </p>
      <div v-else class="grid gap-6 sm:grid-cols-2">
        <div class="grid content-start gap-2">
          <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
            Camera
          </span>
          <Link to="/app/cameras/$cameraId" :params="{ cameraId: detail.camera.id }" :class="ROW">
            <span class="grid gap-0.5">
              <span class="font-medium">{{ cameraName(detail.camera) }}</span>
              <span class="text-muted-foreground text-xs">
                {{ detail.camera.fixedLens ? "Fixed lens" : `Mount: ${detail.camera.mount}` }}
              </span>
            </span>
            <IconChevronRight
              class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
        <div class="grid content-start gap-2">
          <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
            Lenses ({{ detail.lenses.length }})
          </span>
          <p
            v-if="!detail.lenses.length"
            class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm"
          >
            {{ detail.camera.fixedLens ? "Fixed lens" : "None selected" }}
          </p>
          <Link
            v-for="lens in detail.lenses"
            :key="lens.id"
            to="/app/lenses/$lensId"
            :params="{ lensId: lens.id }"
            :class="ROW"
          >
            <span class="grid gap-0.5">
              <span class="font-medium">{{ lensName(lens) }}</span>
              <span v-if="lens.mount" class="text-muted-foreground text-xs">
                Mount: {{ lens.mount }}
              </span>
            </span>
            <IconChevronRight
              class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </FormSection>
  </div>
</template>

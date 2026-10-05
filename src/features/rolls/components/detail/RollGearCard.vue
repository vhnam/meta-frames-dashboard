<script setup lang="ts">
import { cameraName } from "#/features/cameras";
import type { RollDetail } from "../../types";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";

defineProps<{ detail: RollDetail }>();
defineEmits<{ manageLenses: []; load: [] }>();
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Camera &amp; lenses</CardTitle>
      <div class="flex gap-2">
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
          size="sm"
          @click="$emit('manageLenses')"
        >
          Manage lenses
        </Button>
      </div>
    </CardHeader>
    <CardContent class="text-sm">
      <p v-if="!detail.camera" class="text-muted-foreground">Not loaded into a camera yet.</p>
      <dl v-else class="grid gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-muted-foreground text-xs">Camera</dt>
          <dd class="font-medium">{{ cameraName(detail.camera) }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground text-xs">Lenses</dt>
          <dd v-if="!detail.lenses.length" class="text-muted-foreground">
            {{ detail.camera.fixedLens ? "Fixed lens" : "None selected" }}
          </dd>
          <dd v-for="l in detail.lenses" :key="l.id" class="grid">
            <span class="font-medium">{{ [l.brand, l.model].filter(Boolean).join(" ") }}</span>
            <span v-if="l.mount" class="text-muted-foreground text-xs">{{ l.mount }} mount</span>
          </dd>
        </div>
      </dl>
    </CardContent>
  </Card>
</template>

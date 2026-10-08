<script setup lang="ts">
import { Link, useRouter } from "@tanstack/vue-router";
import NotFound from "#/shared/components/NotFound.vue";
import { Button } from "#/shared/ui/button";

const router = useRouter();
</script>

<!-- Protected 404: an unknown path under `/app`, shown inside the dashboard. -->
<template>
  <NotFound>
    <div class="flex flex-wrap justify-center gap-2">
      <Button as-child>
        <Link to="/app/rolls">Back to rolls</Link>
      </Button>
      <Button variant="outline" @click="router.history.back()">Go back</Button>
    </div>
  </NotFound>
</template>

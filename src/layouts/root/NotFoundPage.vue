<script setup lang="ts">
import { Link } from '@tanstack/vue-router';

import BrandLink from '#/shared/components/brand-link/BrandLink.vue';
import NotFound from '#/shared/components/not-found/NotFound.vue';
import { Button } from '#/shared/ui/button';
</script>

<!-- Public 404: any unknown path outside `/app`. -->
<template>
  <div
    class="flex min-h-svh flex-col items-center justify-center gap-8 bg-background bg-dots px-4 py-10"
  >
    <BrandLink />
    <NotFound class="flex-none">
      <Button as-child>
        <Link to="/">Go to home</Link>
      </Button>
    </NotFound>
  </div>
</template>

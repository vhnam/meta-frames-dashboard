<script setup lang="ts">
import { IconBrandGoogleFilled } from "@tabler/icons-vue";
import { Button } from "#/shared/ui/button";
import { googleSignInUrl } from "../api";

const props = defineProps<{ redirect: string }>();
</script>

<template>
  <div class="grid gap-4">
    <!-- a full-page navigation, not fetch: Google redirects the browser back through the API -->
    <Button variant="outline" class="w-full" as-child>
      <a :href="googleSignInUrl(props.redirect)">
        <IconBrandGoogleFilled aria-hidden="true" />
        Continue with Google
      </a>
    </Button>
    <div
      class="text-muted-foreground after:border-border relative text-center text-xs after:absolute after:inset-x-0 after:top-1/2 after:z-0 after:border-t"
    >
      <span class="bg-card relative z-10 px-2">or with email</span>
    </div>
  </div>
</template>

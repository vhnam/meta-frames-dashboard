<script setup lang="ts">
import { IconArrowLeft } from "@tabler/icons-vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "#/shared/ui/breadcrumb";
import { Link, useRouterState } from "@tanstack/vue-router";
import { computed } from "vue";
import { titleForPath } from "./nav";
import { backToListing } from "./listBack";
import { Separator } from "#/shared/ui/separator";
import { SidebarTrigger } from "#/shared/ui/sidebar";
import AlertsButton from "./AlertsButton.vue";

const location = useRouterState({ select: (s) => s.location });
const title = computed(() => titleForPath(location.value.pathname));
const back = computed(() => backToListing(location.value.pathname, location.value.search));
</script>

<template>
  <header
    class="bg-sidebar sticky top-0 z-10 flex h-[4.75rem] shrink-0 items-center gap-3 border-b px-4 md:px-8"
  >
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="data-[orientation=vertical]:h-4 rotate-12" />
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink v-if="back" as-child>
            <Link
              :to="back.to as '/'"
              :search="back.search"
              :active-options="{ exact: true }"
              class="inline-flex h-11 items-center gap-1.5"
              :aria-label="`Back to ${title}`"
            >
              <IconArrowLeft class="size-4" aria-hidden="true" />
              {{ title }}
            </Link>
          </BreadcrumbLink>
          <BreadcrumbPage v-else class="text-sm">{{ title }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div class="ml-auto"><AlertsButton /></div>
  </header>
</template>

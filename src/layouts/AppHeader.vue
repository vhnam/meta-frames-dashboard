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

const location = useRouterState({ select: (s) => s.location });
const title = computed(() => titleForPath(location.value.pathname));
const back = computed(() => backToListing(location.value.pathname, location.value.search));
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
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
          <BreadcrumbPage v-else>{{ title }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </header>
</template>

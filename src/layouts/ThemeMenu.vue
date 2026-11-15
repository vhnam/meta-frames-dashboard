<script setup lang="ts">
import { IconCheck, IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-vue';

import { THEME_MODES, type ThemeMode, useThemeMode } from '#/shared/lib/theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/shared/ui/dropdown-menu';

const { mode, setMode } = useThemeMode();

const OPTIONS: Record<ThemeMode, { label: string; icon: typeof IconSun }> = {
  system: { label: 'System', icon: IconDeviceDesktop },
  light: { label: 'Light', icon: IconSun },
  dark: { label: 'Dark', icon: IconMoon },
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      class="flex size-10 items-center justify-center rounded-full bg-secondary transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-primary/10 data-[state=open]:text-primary"
      :aria-label="`Appearance: ${OPTIONS[mode].label}`"
    >
      <component
        :is="OPTIONS[mode].icon"
        class="size-5"
        aria-hidden="true"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      :side-offset="8"
      class="w-40"
    >
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        :model-value="mode"
        @update:model-value="(value) => setMode(value as ThemeMode)"
      >
        <DropdownMenuRadioItem
          v-for="option in THEME_MODES"
          :key="option"
          :value="option"
        >
          <template #indicator-icon><IconCheck class="size-4" /></template>
          <component
            :is="OPTIONS[option].icon"
            aria-hidden="true"
          />
          {{ OPTIONS[option].label }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

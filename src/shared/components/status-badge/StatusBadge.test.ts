/// <reference types="node" />
// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';

import { mount } from '@vue/test-utils';
import { compile } from 'tailwindcss';
import { expect, it } from 'vite-plus/test';
import { h, nextTick, ref, type Component } from 'vue';

import StatusBadge from './StatusBadge.vue';

const readStyles = (file: string) => readFileSync(`src/styles/${file}`, 'utf8');

it.each([
  { name: 'an omitted tone', tone: undefined },
  { name: 'an unknown tone', tone: 'future-tone' },
  { name: 'an inherited object key', tone: 'toString' },
])('keeps the label and uses neutral colors for $name', async ({ tone }) => {
  const currentTone = ref<string | undefined>('neutral');
  const badge = mount(
    {
      setup: () => () =>
        h(StatusBadge as Component, { tone: currentTone.value }, () => 'Awaiting review'),
    },
    { attachTo: document.body },
  );
  const style = document.createElement('style');
  try {
    const bridge = readStyles('index.css').match(/@theme inline \{[^}]*\}/)?.[0];
    if (!bridge) throw new Error('Missing Tailwind theme bridge');
    const compiler = await compile(`${bridge}\n@tailwind utilities;`);
    style.textContent =
      readStyles('design-tokens.generated.css') + compiler.build([...badge.element.classList]);
    document.head.append(style);

    const { color, backgroundColor } = getComputedStyle(badge.element);
    expect(color).not.toBe('');
    expect(backgroundColor).not.toBe('');
    expect(backgroundColor).not.toBe('transparent');

    currentTone.value = tone;
    await nextTick();

    expect(badge.text()).toBe('Awaiting review');
    expect(getComputedStyle(badge.element).backgroundColor).toBe(backgroundColor);
    expect(getComputedStyle(badge.element).color).toBe(color);
  } finally {
    style.remove();
    badge.unmount();
  }
});

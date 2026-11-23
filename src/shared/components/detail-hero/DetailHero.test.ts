// @vitest-environment happy-dom
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, expect, it } from 'vite-plus/test';
import { h, nextTick, ref } from 'vue';

import DetailHero from './DetailHero.vue';

enableAutoUnmount(afterEach);

it('updates the record title and restores the dashboard title on unmount', async () => {
  const title = ref('Nikon F3');
  const wrapper = mount(() =>
    h(DetailHero, { kind: 'Camera', id: 'camera-1', title: title.value }),
  );
  expect(document.title).toBe('Nikon F3 | Meta Frames');

  title.value = 'Canon AE-1';
  await nextTick();
  expect(document.title).toBe('Canon AE-1 | Meta Frames');

  wrapper.unmount();
  expect(document.title).toBe('Meta Frames | Dashboard');
});

it('preserves dollar sequences in record titles', () => {
  mount(DetailHero, { props: { kind: 'Camera', id: 'camera-1', title: 'Custom $& Camera' } });

  expect(document.title).toBe('Custom $& Camera | Meta Frames');
});

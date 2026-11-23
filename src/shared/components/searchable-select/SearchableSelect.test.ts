// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { defineComponent, h, ref } from 'vue';

import SearchableSelect from './SearchableSelect.vue';

const value = ref('');
const render = (start = '') => {
  value.value = start;
  return mount(
    defineComponent(
      () => () =>
        h(SearchableSelect, {
          options: [
            { value: 'a1', label: 'Fujifilm C200' },
            { value: 'b2', label: 'Kodak Gold' },
          ],
          modelValue: value.value,
          'onUpdate:modelValue': (next: string) => (value.value = next),
        }),
    ),
    { attachTo: document.body },
  );
};
const labels = () =>
  [...document.body.querySelectorAll('[role="option"]')].map((element) =>
    element.textContent?.trim(),
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SearchableSelect', () => {
  it('omits the input ID and description when no field IDs are supplied', () => {
    const wrapper = render();
    try {
      const input = wrapper.get('input[role="combobox"]');
      expect(input.attributes('id')).toBeUndefined();
      expect(input.attributes('aria-describedby')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('filters by label and stores the option value', async () => {
    const wrapper = render();
    await wrapper.find('input').setValue('fuji');
    await flushPromises();
    expect(labels()).toEqual(['Fujifilm C200']);
    // a blur before the click (mouse-down on the option) must not change the list
    await wrapper.find('input').trigger('blur');
    await flushPromises();
    expect(labels()).toEqual(['Fujifilm C200']);
    (document.body.querySelector('[role="option"]') as HTMLElement).click();
    await flushPromises();
    expect(value.value).toBe('a1');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Fujifilm C200');
    wrapper.unmount();
  });

  it('puts the chosen label back when the list closes with other text', async () => {
    const wrapper = render('b2');
    const input = wrapper.find('input');
    await input.setValue('zzz');
    await flushPromises();
    await input.trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect((input.element as HTMLInputElement).value).toBe('Kodak Gold');
    expect(value.value).toBe('b2');
    wrapper.unmount();
  });
});

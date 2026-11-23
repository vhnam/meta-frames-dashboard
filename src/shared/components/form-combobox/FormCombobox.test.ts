// @vitest-environment happy-dom
import { Form, useForm } from '@formisch/vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import * as v from 'valibot';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h } from 'vue';

import FormCombobox from './FormCombobox.vue';

enableAutoUnmount(afterEach);

it('associates the combobox input with its label and validation error', async () => {
  const wrapper = mount(
    defineComponent({
      setup() {
        const form = useForm({
          schema: v.object({ brand: v.pipe(v.string(), v.nonEmpty()) }),
          initialInput: { brand: '' },
        });
        return () =>
          h(Form, { of: form, onSubmit: () => {} }, () =>
            h(FormCombobox, {
              of: form,
              path: ['brand'],
              label: 'Brand',
              options: [{ value: 'Nikon' }],
            }),
          );
      },
    }),
  );

  const input = wrapper.get('input[role="combobox"]');
  const id = input.attributes('id');
  expect(id).toBeTruthy();
  expect(wrapper.get('label').attributes('for')).toBe(id);
  expect(input.attributes('aria-describedby')).toBeUndefined();
  expect(input.attributes('aria-invalid')).toBeUndefined();

  await wrapper.get('form').trigger('submit');
  await vi.waitFor(() => {
    const errorId = wrapper.get('p[role="alert"]').attributes('id');
    expect(errorId).toBeTruthy();
    expect(input.attributes('aria-describedby')).toBe(errorId);
    expect(input.attributes('aria-invalid')).toBe('true');
  });
});

// @vitest-environment happy-dom
import { Form, useForm } from '@formisch/vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import * as v from 'valibot';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h } from 'vue';

import FormSelect from './FormSelect.vue';

enableAutoUnmount(afterEach);

it('associates the rendered select trigger with its label and validation error', async () => {
  const wrapper = mount(
    defineComponent({
      setup() {
        const form = useForm({
          schema: v.object({ format: v.pipe(v.string(), v.nonEmpty()) }),
          initialInput: { format: '' },
        });
        return () =>
          h(Form, { of: form, onSubmit: () => {} }, () =>
            h(FormSelect, {
              of: form,
              path: ['format'],
              label: 'Format',
              options: [{ value: '135', label: '35 mm' }],
            }),
          );
      },
    }),
  );

  const trigger = wrapper.get('button[role="combobox"]');
  const id = trigger.attributes('id');
  expect(id).toBeTruthy();
  expect(wrapper.get('label').attributes('for')).toBe(id);
  expect(trigger.attributes('aria-describedby')).toBeUndefined();

  await wrapper.get('form').trigger('submit');
  await vi.waitFor(() => {
    const error = wrapper.get('p[role="alert"]');
    expect(error.attributes('id')).toBeTruthy();
    expect(trigger.attributes('aria-describedby')).toBe(error.attributes('id'));
  });
});

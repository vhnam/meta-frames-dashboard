// @vitest-environment happy-dom
import { Form, setInput, useForm } from '@formisch/vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import * as v from 'valibot';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h } from 'vue';

import FormRichText from './FormRichText.vue';

enableAutoUnmount(afterEach);

it('keeps the label association when validation adds and clears an error', async () => {
  const wrapper = mount(
    defineComponent({
      setup() {
        const form = useForm({
          schema: v.object({ notes: v.pipe(v.string(), v.nonEmpty()) }),
          initialInput: { notes: '' },
        });
        return () =>
          h(Form, { of: form, onSubmit: () => {} }, () => [
            h(FormRichText, { of: form, path: ['notes'], label: 'Notes' }),
            h('button', {
              type: 'button',
              onClick: () => setInput(form, { path: ['notes'], input: 'Valid notes' }),
            }),
          ]);
      },
    }),
  );

  const input = await vi.waitFor(() => wrapper.get('[data-slot="rich-text-input"]'));
  const labelId = wrapper.get('label').attributes('id');
  expect(labelId).toBeTruthy();
  const stableAttributes = {
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-labelledby': labelId,
    'data-slot': 'rich-text-input',
    class: input.attributes('class'),
  };
  expect(input.attributes()).toMatchObject(stableAttributes);
  expect(input.attributes('aria-describedby')).toBeUndefined();

  await wrapper.get('form').trigger('submit');
  await vi.waitFor(() => {
    const errorId = wrapper.get('p[role="alert"]').attributes('id');
    expect(errorId).toBeTruthy();
    expect(input.attributes('aria-describedby')).toBe(errorId);
  });
  expect(input.attributes()).toMatchObject(stableAttributes);

  await wrapper.get('form > button[type="button"]').trigger('click');
  await wrapper.get('form').trigger('submit');
  await vi.waitFor(() => expect(input.attributes('aria-describedby')).toBeUndefined());
  expect(input.attributes()).toMatchObject(stableAttributes);
});

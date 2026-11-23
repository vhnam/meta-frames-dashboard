// @vitest-environment happy-dom
import type { Editor } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vite-plus/test';
import { defineComponent, h, ref } from 'vue';

import RichText from '../rich-text/RichText.vue';
import RichTextEditor from './RichTextEditor.vue';

/** The editor bound with v-model to `notes`, as a form would bind it. */
const notes = ref('');
const editorOf = async (value: string) => {
  notes.value = value;
  const wrapper = mount(
    defineComponent(
      () => () =>
        h(RichTextEditor, {
          modelValue: notes.value,
          'onUpdate:modelValue': (next: string) => (notes.value = next),
        }),
    ),
    { attachTo: document.body },
  );
  await flushPromises();
  return wrapper;
};

describe('RichTextEditor', () => {
  it('keeps its explicit ID and editable state through description changes', async () => {
    const describedBy = ref<string>();
    const disabled = ref(false);
    const wrapper = mount(() =>
      h(RichTextEditor, {
        id: 'order-notes',
        describedBy: describedBy.value,
        disabled: disabled.value,
      }),
    );
    try {
      await flushPromises();
      const input = wrapper.get('[data-slot="rich-text-input"]');
      expect(input.attributes('id')).toBe('order-notes');
      expect(input.attributes('aria-labelledby')).toBeUndefined();
      expect(input.attributes('aria-describedby')).toBeUndefined();

      describedBy.value = 'order-notes-error';
      await flushPromises();
      expect(input.attributes('id')).toBe('order-notes');
      expect(input.attributes('aria-describedby')).toBe('order-notes-error');

      disabled.value = true;
      await flushPromises();
      expect(input.attributes('contenteditable')).toBe('false');
      expect(input.attributes('aria-describedby')).toBe('order-notes-error');

      describedBy.value = undefined;
      await flushPromises();
      expect(input.attributes('id')).toBe('order-notes');
      expect(input.attributes('aria-describedby')).toBeUndefined();
      expect(input.attributes('contenteditable')).toBe('false');

      disabled.value = false;
      await flushPromises();
      expect(input.attributes('contenteditable')).toBe('true');
    } finally {
      wrapper.unmount();
    }
  });

  it('shows Markdown as formatted text', async () => {
    const wrapper = await editorOf('Push **one stop**\n\n- fine grain\n- warm');
    expect(wrapper.find('strong').text()).toBe('one stop');
    expect(wrapper.findAll('li')).toHaveLength(2);
    wrapper.unmount();
  });

  it('writes formatting back as Markdown', async () => {
    const wrapper = await editorOf('grain');
    // select all, then bold it from the toolbar
    const editor = wrapper.findComponent({ name: 'EditorContent' }).props('editor') as Editor;
    editor.commands.selectAll();
    await wrapper.find('button[aria-label="Bold"]').trigger('click');
    await flushPromises();
    expect(notes.value).toBe('**grain**');
    expect(wrapper.find('button[aria-label="Bold"]').attributes('aria-pressed')).toBe('true');
    wrapper.unmount();
  });

  it('takes outside changes, e.g. a form reset', async () => {
    const wrapper = await editorOf('old notes');
    notes.value = '## New';
    await flushPromises();
    expect(wrapper.find('h2').text()).toBe('New');
    notes.value = '';
    await flushPromises();
    expect(wrapper.text()).not.toContain('New');
    wrapper.unmount();
  });

  it('keeps plain-text notes as they are', async () => {
    const wrapper = await editorOf('Rated at 320.');
    expect(wrapper.find('p').text()).toBe('Rated at 320.');
    wrapper.unmount();
  });
});

describe('RichText', () => {
  it('renders Markdown read-only', async () => {
    const wrapper = mount(RichText, { props: { markdown: '*soft* highlights' } });
    await flushPromises();
    expect(wrapper.find('em').text()).toBe('soft');
    expect(wrapper.find('[contenteditable="true"]').exists()).toBe(false);
    wrapper.unmount();
  });
});

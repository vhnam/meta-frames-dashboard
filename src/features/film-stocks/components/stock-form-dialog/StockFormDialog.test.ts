// @vitest-environment happy-dom
import { VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { queryClient } from '#/shared/api/client';
import { http } from '#/shared/api/http';
import { installFakeServer, server } from '#/test/fakeServer';

import StockFormDialog from './StockFormDialog.vue';

installFakeServer();
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
  document.body.innerHTML = '';
});

describe('StockFormDialog brand', () => {
  it("keeps the edited stock's brand and suggests each known brand once, whatever its case", async () => {
    server.addStock({ brand: 'Kodak', name: 'Gold 200' });
    server.addStock({ brand: 'kodak', name: 'Portra 400' });
    const edited = server.addStock({ brand: 'Ilford', name: 'HP5' });
    const wrapper = mount(StockFormDialog, {
      attachTo: document.body,
      props: { open: false, stockId: edited.id },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await flushPromises();
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const brand = document.body.querySelector<HTMLInputElement>(
      'input[placeholder="Choose or type a brand"]',
    )!;
    expect(brand.value).toBe('Ilford');
    brand.nextElementSibling!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    const options = [...document.body.querySelectorAll('[role="option"]')].map((option) =>
      option.querySelector('span')?.textContent?.trim(),
    );
    expect(options).toEqual(['Ilford', 'Kodak']);
    wrapper.unmount();
  });
});

it('saves a stock whose film type and process produce a compatibility warning', async () => {
  const stock = server.addStock({ type: 'bw', process: 'C-41' });
  const save = vi.spyOn(http, 'put').mockResolvedValue({ status: 204 });
  const wrapper = mount(StockFormDialog, {
    attachTo: document.body,
    props: { open: false, stockId: stock.id },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });

  try {
    await flushPromises();
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    document.body
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(save).toHaveBeenCalledExactlyOnceWith(
      `/film-stocks/${stock.id}`,
      expect.objectContaining({ type: 'bw', process: 'C-41' }),
    );
    expect(wrapper.emitted('saved')).toEqual([[stock.id]]);
  } finally {
    wrapper.unmount();
    save.mockRestore();
  }
});

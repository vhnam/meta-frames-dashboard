import { VueQueryPlugin } from '@tanstack/vue-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/vue-router';
import { flushPromises, mount } from '@vue/test-utils';
import { AxiosError, type AxiosAdapter } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { h, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

import { installProviders } from '#/app/providers';
import { queryClient } from '#/shared/api/client';
import { http } from '#/shared/api/http';
import { installFakeServer, server } from '#/test/fakeServer';

// @vitest-environment happy-dom
import { rollQueries, updateRoll } from '../../api';
import RollEditDialog from './RollEditDialog.vue';

installFakeServer();
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe('RollEditDialog', () => {
  it('saves changed exposures through PUT /rolls/{id}', async () => {
    const stock = server.addStock({ name: 'UltraMax' });
    const rec = server.addRoll({ filmStockId: stock.id, exposures: 36 });
    const [{ data: row }] = [
      {
        data: (await queryClient.fetchQuery(rollQueries.list({}))).find(
          (row) => row.roll.id === rec.id,
        )!,
      },
    ];
    const wrapper = mount(RollEditDialog, {
      attachTo: document.body,
      props: { open: false, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const exposures = [...document.body.querySelectorAll('input')].find(
      (input) => input.value === '36',
    )!;
    exposures.value = '24';
    exposures.dispatchEvent(new Event('input', { bubbles: true }));
    const year = document.body.querySelector('input[placeholder="e.g. 2027"]') as HTMLInputElement;
    year.value = '2028';
    year.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();
    (document.body.querySelector('button[type=submit]') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    // the API reads a nested expiry object and ignores flat expiryYear / expiryMonth
    const put = server.requests.find((request) => request.method === 'put')!.body as Record<
      string,
      unknown
    >;
    expect(put).toMatchObject({ expiry: { year: 2028 } });
    expect(Object.keys(put).sort((left, right) => left.localeCompare(right))).toEqual([
      'expiry',
      'exposures',
      'filmStockId',
      'format',
    ]);
    expect(server.rolls[0].expiry).toEqual({ year: 2028, month: undefined });
    wrapper.unmount();
  });

  async function openOn(rollId: string) {
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (candidate) => candidate.roll.id === rollId,
    )!;
    const wrapper = mount(RollEditDialog, {
      attachTo: document.body,
      props: { open: false, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    return wrapper;
  }

  const exposuresInput = () =>
    document.body.querySelector('input[placeholder="e.g. 36"]') as HTMLInputElement;
  const typeExposures = async (value: string) => {
    exposuresInput().value = value;
    exposuresInput().dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();
  };
  const save = async () => {
    (document.body.querySelector('button[type=submit]') as HTMLButtonElement).click();
    await flushPromises();
  };
  const clickButton = async (text: string) => {
    [...document.body.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === text)!
      .click();
    await flushPromises();
  };
  const puts = () => server.requests.filter((request) => request.method === 'put');

  it('keeps a failed roll conflict refresh out of the route error boundary', async () => {
    const rec = server.addRoll({ version: 2 });
    const [row] = await queryClient.fetchQuery(rollQueries.list({}));
    const rootRoute = createRootRoute({
      component: {
        setup() {
          const open = ref(false);
          onMounted(() => {
            open.value = true;
          });
          return () => h(RollEditDialog, { row, open: open.value });
        },
      },
    });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await router.load();
    const wrapper = mount(() => h(RouterProvider, { router }), {
      attachTo: document.body,
      global: { plugins: [installProviders] },
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(toast.error).mockClear();
    Object.assign(server.rolls[0], { exposures: 12, version: 3 });
    const originalAdapter = http.defaults.adapter;
    const refreshError = new AxiosError('Network Error', 'ERR_NETWORK');
    http.defaults.adapter = (config) => {
      if (config.method === 'get' && config.url === `/rolls/${rec.id}`) {
        return Promise.reject(refreshError);
      }
      return (originalAdapter as AxiosAdapter)(config);
    };

    try {
      await vi.waitFor(() => expect(exposuresInput()).toBeTruthy());
      await typeExposures('24');
      await save();
      await vi.waitFor(
        () =>
          expect(queryClient.getQueryState(rollQueries.detail(rec.id).queryKey)?.error).toBe(
            refreshError,
          ),
        { timeout: 3000 },
      );
      await flushPromises();
      expect(toast.error).toHaveBeenCalledExactlyOnceWith(
        'the roll was changed since it was loaded; reload it and apply your edit again',
        expect.not.objectContaining({ id: 'unexpected-error' }),
      );
      expect(log).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalledWith('Warning:', refreshError);
      expect(exposuresInput().value).toBe('24');
      expect(document.body.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(
        false,
      );
      expect(puts()).toHaveLength(1);

      http.defaults.adapter = originalAdapter;
      await save();
      await vi.waitFor(() => {
        const conflict = document.body.querySelector('[role=alert]');
        expect(conflict?.textContent).toContain('12');
        expect(conflict?.textContent).toContain('Keep my edits');
        expect(conflict?.textContent).toContain('Use the current values');
      });
      expect(puts()).toHaveLength(2);
      expect(puts()[1].headers['If-Match']).toBe('"2"');
      expect(
        server.requests.filter(({ method, url }) => method === 'get' && url === `/rolls/${rec.id}`),
      ).toHaveLength(1);
      expect(exposuresInput().value).toBe('24');
    } finally {
      http.defaults.adapter = originalAdapter;
      log.mockRestore();
      warn.mockRestore();
      wrapper.unmount();
    }
  });

  it('sends the version it loaded as If-Match', async () => {
    const rec = server.addRoll({ version: 4 });
    const wrapper = await openOn(rec.id);
    await typeExposures('24');
    await save();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    expect(puts()[0].headers['If-Match']).toBe('"4"');
    wrapper.unmount();
  });

  it("keeps the user's edits on 412 and saves them over the latest roll only when asked", async () => {
    const rec = server.addRoll({ exposures: 36, version: 2 });
    const wrapper = await openOn(rec.id);
    // a phone saves a note while the form is open
    Object.assign(server.rolls[0], { description: 'from the phone', version: 3 });

    await typeExposures('24');
    await save();
    await vi.waitFor(() => expect(document.body.querySelector('[role=alert]')).not.toBeNull());
    expect(server.rolls[0]).toMatchObject({ exposures: 36, description: 'from the phone' });
    expect(exposuresInput().value).toBe('24');
    expect(puts()).toHaveLength(1);
    // no retry while the user has not chosen
    await save();
    expect(puts()).toHaveLength(1);

    await clickButton('Keep my edits');
    expect(exposuresInput().value).toBe('24');
    await save();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    expect(puts()).toHaveLength(2);
    expect(puts()[1].headers['If-Match']).toBe('"3"');
    expect(server.rolls[0].description).toBe('from the phone');
    wrapper.unmount();
  });

  it('sends no If-Match when the server reported no version', async () => {
    const rec = server.addRoll();
    const row = (await queryClient.fetchQuery(rollQueries.list({})))[0];
    await updateRoll({
      row: { ...row, roll: { ...row.roll, version: null } },
      input: {
        stockId: rec.filmStockId,
        format: '135',
        exposures: 24,
        price: null,
        expiryYear: null,
        expiryMonth: null,
      },
    });
    expect(puts()[0].headers).not.toHaveProperty('If-Match');
  });

  it("can drop the user's edits for the latest values instead", async () => {
    const rec = server.addRoll({ exposures: 36, version: 0 });
    const wrapper = await openOn(rec.id);
    Object.assign(server.rolls[0], { exposures: 12, version: 1 });

    await typeExposures('24');
    await save();
    await vi.waitFor(() => expect(document.body.querySelector('[role=alert]')).not.toBeNull());
    await clickButton('Use the current values');
    expect(exposuresInput().value).toBe('12');
    expect(server.rolls[0].exposures).toBe(12);
    expect(puts()).toHaveLength(1);
    wrapper.unmount();
  });
});

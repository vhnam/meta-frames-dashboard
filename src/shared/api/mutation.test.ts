// @vitest-environment happy-dom
import { onlineManager, useMutation, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h } from 'vue';
import { toast } from 'vue-sonner';

import { auditKeys } from '#/features/audit/api';

import { errorMessage, queryClient } from './client';
import { http } from './http';
import { useApiMutation } from './mutation';

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => queryClient.clear());

describe('audit log after a write', () => {
  it('goes stale after a write that invalidates data, not after a no-op', async () => {
    queryClient.setQueryData(auditKeys.list(), []);
    let write!: ReturnType<typeof useApiMutation<void>>;
    let preview!: ReturnType<typeof useApiMutation<void>>;
    const wrapper = mount(
      defineComponent({
        setup() {
          write = useApiMutation({ fn: () => {}, invalidates: () => [['rolls']] });
          preview = useApiMutation({ fn: () => {}, invalidates: () => [] });
          return () => h('div');
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );

    await preview.mutateAsync();
    expect(queryClient.getQueryState(auditKeys.list())?.isInvalidated).toBe(false);
    await write.mutateAsync();
    expect(queryClient.getQueryState(auditKeys.list())?.isInvalidated).toBe(true);
    wrapper.unmount();
  });
});

describe('offline saves', () => {
  it.each([false, true])(
    'fails offline without replaying on reconnect (quiet: %s)',
    async (quiet) => {
      const message = 'Could not reach the server. Check your connection and try again.';
      const adapter = vi.fn(async () => {
        throw new AxiosError('Network Error', 'ERR_NETWORK');
      });
      const wasOnline = onlineManager.isOnline();
      vi.mocked(toast.error).mockClear();
      onlineManager.setOnline(false);

      let save!: ReturnType<typeof useMutation<void>>;
      const wrapper = mount(
        defineComponent({
          setup() {
            save = useMutation({
              mutationFn: async () => {
                await http.post('/cameras', {}, { adapter });
              },
              meta: { quiet },
            });
            return () => h('div');
          },
        }),
        { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
      );

      try {
        save.mutate();
        await vi.waitFor(() => expect(save.status.value).toBe('error'));
        expect(save.isPaused.value).toBe(false);
        expect(errorMessage(save.error.value)).toBe(message);
        expect(adapter).toHaveBeenCalledTimes(1);
        if (quiet) {
          expect(toast.error).not.toHaveBeenCalled();
        } else {
          expect(toast.error).toHaveBeenCalledExactlyOnceWith(message, expect.any(Object));
        }

        onlineManager.setOnline(true);
        await flushPromises();
        expect(adapter).toHaveBeenCalledTimes(1);
        expect(save.status.value).toBe('error');
      } finally {
        wrapper.unmount();
        queryClient.clear();
        onlineManager.setOnline(wasOnline);
      }
    },
  );
});

import { AxiosError } from 'axios';
import { expect, it, vi } from 'vite-plus/test';

import { http, setUnauthorizedHandler } from './http';

it('keeps the AxiosError and replaces its message when no response arrives', async () => {
  const error = new AxiosError('Network Error', 'ERR_NETWORK');
  const request = http.get('/cameras', { adapter: () => Promise.reject(error) });

  await expect(request).rejects.toBe(error);
  expect(error.message).toBe('Could not reach the server. Check your connection and try again.');
});

it.each([
  { url: '/cameras', unauthorizedCalls: 1 },
  { url: '/auth/login', unauthorizedCalls: 0 },
])(
  'uses the server message and applies the unauthorized rule for $url',
  async ({ url, unauthorizedCalls }) => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    const request = http.get(url, {
      adapter: async (config) => {
        throw new AxiosError(
          'Request failed with status code 401',
          'ERR_BAD_REQUEST',
          config,
          null,
          {
            config,
            data: { code: 'unauthorized', message: 'Session required.' },
            headers: {},
            status: 401,
            statusText: 'Unauthorized',
          },
        );
      },
    });

    await expect(request).rejects.toMatchObject({
      message: 'Session required.',
      response: { status: 401 },
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(unauthorizedCalls);
  },
);

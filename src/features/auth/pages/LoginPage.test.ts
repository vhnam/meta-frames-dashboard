// @vitest-environment happy-dom
import { VueQueryPlugin } from '@tanstack/vue-query';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { queryClient } from '#/shared/api/client';
import { http } from '#/shared/api/http';

import { googleErrors } from '../session';
import LoginPage from './LoginPage.vue';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@tanstack/vue-router', async (original) => ({
  ...(await original<typeof import('@tanstack/vue-router')>()),
  useRouter: () => ({ history: { push } }),
}));
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const user = {
  id: '5a0c2f6e-8d31-4b7a-9e15-3c7f1d2b4a60',
  email: 'ansel@example.com',
  name: 'Ansel',
  createdAt: '2026-10-07T09:00:00Z',
};

let loginReply: { status: number; data: unknown };
const originalAdapter = http.defaults.adapter;
http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
  const response = {
    ...loginReply,
    statusText: String(loginReply.status),
    headers: {},
    config,
  };
  if (loginReply.status >= 400) {
    throw new AxiosError(`HTTP ${loginReply.status}`, 'ERR_BAD_REQUEST', config, null, response);
  }
  return response;
};

const Link = { name: 'Link', template: '<a><slot /></a>' };
enableAutoUnmount(afterEach);
afterAll(() => {
  http.defaults.adapter = originalAdapter;
});
beforeEach(() => {
  push.mockClear();
  queryClient.clear();
});

function mountPage(props: { redirect?: string; error?: string } = {}) {
  return mount(LoginPage, {
    props,
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });
}

async function signIn(props: { redirect?: string; error?: string } = {}) {
  const wrapper = mountPage(props);
  await wrapper.find('input[type="email"]').setValue('ansel@example.com');
  await wrapper.find('input[type="password"]').setValue('Zone-System5');
  await wrapper.find('form').trigger('submit');
  await flushPromises();
  return wrapper;
}

describe('LoginPage', () => {
  it("shows the server's message when the account is locked and stays on the page", async () => {
    loginReply = {
      status: 429,
      data: { code: 'account_locked', message: 'Too many attempts. Try later.' },
    };
    const wrapper = await signIn();
    await vi.waitFor(() => expect(wrapper.text()).toContain('Too many attempts. Try later.'));
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the server's message for wrong credentials and stays on the page", async () => {
    loginReply = {
      status: 401,
      data: { code: 'invalid_credentials', message: 'Wrong email or password.' },
    };
    const wrapper = await signIn();
    await vi.waitFor(() => expect(wrapper.text()).toContain('Wrong email or password.'));
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    ['/app/labs?page=2', '/app/labs?page=2'],
    ['https://evil.com/app', '/app'],
    ['//evil.com/app', '/app'],
    [undefined, '/app'],
  ])('after sign-in with redirect %s it goes to %s', async (redirect, expected) => {
    loginReply = { status: 200, data: { message: 'Logged in', user } };
    await signIn({ redirect });
    await vi.waitFor(() => expect(push).toHaveBeenCalledExactlyOnceWith(expected));
  });
  describe('Google', () => {
    it.each(Object.entries(googleErrors))(
      'shows a readable message for ?error=%s and stays on the page',
      (code, message) => {
        const wrapper = mountPage({ error: code });
        expect(wrapper.text()).toContain(message);
        expect(push).not.toHaveBeenCalled();
      },
    );

    it('treats an unknown error code as a failed Google sign-in', () => {
      expect(mountPage({ error: 'something_new' }).text()).toContain(googleErrors.google_failed);
    });

    it('shows no Google error when the page opens without one', () => {
      const text = mountPage().text();
      for (const message of Object.values(googleErrors)) expect(text).not.toContain(message);
    });

    it('hides the Google error once a password sign-in fails', async () => {
      loginReply = {
        status: 401,
        data: { code: 'invalid_credentials', message: 'Wrong email or password.' },
      };
      const wrapper = await signIn({ error: 'google_denied' });
      await vi.waitFor(() => expect(wrapper.text()).toContain('Wrong email or password.'));
      expect(wrapper.text()).not.toContain(googleErrors.google_denied);
    });

    it.each([
      ['/app/labs?page=2', '/app/labs?page=2'],
      ['https://evil.com/app', '/app'],
      [undefined, '/app'],
    ])('the Google button for redirect %s returns to %s', (redirect, expected) => {
      const href = mountPage({ redirect })
        .find('a[href*="/auth/oauth2/google"]')
        .attributes('href');
      const url = new URL(href!, 'http://localhost');
      expect(url.pathname).toBe('/auth/oauth2/google');
      expect(url.searchParams.get('redir')).toBe(expected);
    });
  });
});

// @vitest-environment happy-dom
import { VueQueryPlugin } from '@tanstack/vue-query';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { queryClient } from '#/shared/api/client';
import { http } from '#/shared/api/http';

import { PASSWORD_HINT } from '../schema';
import RegisterPage from './RegisterPage.vue';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@tanstack/vue-router', async (original) => ({
  ...(await original<typeof import('@tanstack/vue-router')>()),
  useRouter: () => ({ history: { push } }),
}));
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const user = {
  id: '5a0c2f6e-8d31-4b7a-9e15-3c7f1d2b4a60',
  email: 'ansel@example.com',
  name: 'Ansel Adams',
  createdAt: '2026-10-07T09:00:00Z',
};

let reply: { status: number; data: unknown };
const requests: InternalAxiosRequestConfig[] = [];
const originalAdapter = http.defaults.adapter;
http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
  requests.push(config);
  const response = { ...reply, statusText: String(reply.status), headers: {}, config };
  if (reply.status >= 400) {
    throw new AxiosError(`HTTP ${reply.status}`, 'ERR_BAD_REQUEST', config, null, response);
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
  requests.length = 0;
  queryClient.clear();
});

function mountPage(props: { redirect?: string } = {}) {
  return mount(RegisterPage, {
    props,
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });
}

async function submit(wrapper: ReturnType<typeof mountPage>, password = 'Zone-System5') {
  const passwords = wrapper.findAll('input[type="password"]');
  await wrapper.find('input[autocomplete="name"]').setValue('Ansel Adams');
  await wrapper.find('input[type="email"]').setValue('ansel@example.com');
  await passwords[0]!.setValue(password);
  await passwords[1]!.setValue(password);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('RegisterPage', () => {
  it('shows the password rules before anything is submitted', () => {
    expect(mountPage().text()).toContain(PASSWORD_HINT);
  });

  it('does not call the API when the password breaks the rules', async () => {
    const wrapper = mountPage();
    await submit(wrapper, 'weak');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Use at least 8 characters.'));
    expect(requests).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the server's message when the email is taken and stays on the page", async () => {
    reply = {
      status: 409,
      data: { code: 'email_taken', message: 'An account with this email already exists.' },
    };
    const wrapper = mountPage();
    await submit(wrapper);
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('An account with this email already exists.'),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    ['/app/labs?page=2', '/app/labs?page=2'],
    ['https://evil.com/app', '/app'],
    [undefined, '/app'],
  ])('after registering with redirect %s it goes to %s', async (redirect, expected) => {
    reply = { status: 201, data: { message: 'Registered', user } };
    await submit(mountPage({ redirect }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledExactlyOnceWith(expected));
    expect(requests[0]?.data).toContain('"email":"ansel@example.com"');
  });
});

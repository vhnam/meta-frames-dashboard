<script setup lang="ts">
import { Form, useForm } from '@formisch/vue';
import { Link, useRouter } from '@tanstack/vue-router';
import { isAxiosError } from 'axios';
import type * as v from 'valibot';
import { computed } from 'vue';

import { errorMessage } from '#/shared/api/client';
import { notify } from '#/shared/lib/toast';
import { Button } from '#/shared/ui/button';

import AuthCard from '../components/auth-card/AuthCard.vue';
import AuthInput from '../components/auth-input/AuthInput.vue';
import AuthSubmit from '../components/auth-submit/AuthSubmit.vue';
import FormAlert from '../components/form-alert/FormAlert.vue';
import { useResetPassword } from '../queries';
import { PASSWORD_HINT, ResetPasswordSchema } from '../schema';

const props = defineProps<{ token?: string }>();

const router = useRouter();
const reset = useResetPassword();
const form = useForm({
  schema: ResetPasswordSchema,
  initialInput: { password: '', confirmPassword: '' },
});
// unknown, used or expired token: the user needs a new email
const badToken = computed(
  () =>
    !props.token || (isAxiosError(reset.error.value) && reset.error.value.response?.status === 422),
);

async function submit({ password }: v.InferOutput<typeof ResetPasswordSchema>) {
  try {
    await reset.mutateAsync({ token: props.token ?? '', password });
  } catch {
    return; // shown inline
  }
  notify.success('Password changed. Log in with your new password.');
  await router.navigate({ to: '/auth/login' });
}
</script>

<template>
  <AuthCard
    title="Set a new password"
    description="Every other session of your account will be logged out."
  >
    <template v-if="badToken">
      <FormAlert>
        {{
          props.token ? errorMessage(reset.error.value) : 'This reset link is missing its token.'
        }}
        Request a new link to continue.
      </FormAlert>
      <Button
        as-child
        class="h-11 w-full font-heading text-base font-bold tracking-[0.08em] uppercase"
      >
        <Link to="/auth/recover">Request a new link</Link>
      </Button>
    </template>
    <Form
      v-else
      :of="form"
      class="grid gap-5"
      @submit="submit"
    >
      <FormAlert v-if="reset.isError.value">{{ errorMessage(reset.error.value) }}</FormAlert>
      <AuthInput
        :of="form"
        :path="['password']"
        label="New password"
        type="password"
        autocomplete="new-password"
        placeholder="At least 8 characters"
        :hint="PASSWORD_HINT"
      />
      <AuthInput
        :of="form"
        :path="['confirmPassword']"
        label="Confirm new password"
        type="password"
        autocomplete="new-password"
        placeholder="Repeat the password"
      />
      <AuthSubmit :pending="reset.isPending.value">
        {{ reset.isPending.value ? 'Saving…' : 'Change password' }}
      </AuthSubmit>
    </Form>
    <p class="text-center">
      <Link
        to="/auth/login"
        class="text-xs font-semibold tracking-[0.12em] text-primary uppercase underline-offset-4 hover:underline"
      >
        Back to log in
      </Link>
    </p>
  </AuthCard>
</template>

<script setup lang="ts">
import { Form, useForm } from "@formisch/vue";
import { Link, useRouter } from "@tanstack/vue-router";
import type * as v from "valibot";
import { computed } from "vue";
import { errorMessage } from "#/shared/api/client";
import AuthCard from "../components/AuthCard.vue";
import AuthInput from "../components/AuthInput.vue";
import AuthSubmit from "../components/AuthSubmit.vue";
import FormAlert from "../components/FormAlert.vue";
import GoogleSignIn from "../components/GoogleSignIn.vue";
import { useLogin } from "../queries";
import { LoginSchema } from "../schema";
import { googleErrors, safeRedirect } from "../session";

const props = defineProps<{ redirect?: string; error?: string }>();

const router = useRouter();
const login = useLogin();
const form = useForm({ schema: LoginSchema, initialInput: { email: "", password: "" } });
const target = computed(() => safeRedirect(props.redirect));
const googleError = computed(() =>
  props.error ? (googleErrors[props.error] ?? googleErrors.google_failed) : undefined,
);

async function submit(o: v.InferOutput<typeof LoginSchema>) {
  try {
    await login.mutateAsync(o);
  } catch {
    return; // shown inline
  }
  router.history.push(target.value);
}
</script>

<template>
  <AuthCard
    title="Sign in to Meta Frames"
    description="Access your roll logs, gear stash and darkroom archives."
  >
    <FormAlert v-if="googleError && !login.isError.value">{{ googleError }}</FormAlert>
    <GoogleSignIn :redirect="target" />
    <Form :of="form" class="grid gap-5" @submit="submit">
      <FormAlert v-if="login.isError.value">{{ errorMessage(login.error.value) }}</FormAlert>
      <AuthInput
        :of="form"
        :path="['email']"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
      />
      <div class="grid gap-3">
        <AuthInput
          :of="form"
          :path="['password']"
          label="Password"
          type="password"
          autocomplete="current-password"
          placeholder="Enter your password"
        />
        <Link
          to="/auth/recover"
          class="text-primary justify-self-end text-xs font-semibold tracking-[0.12em] uppercase underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <AuthSubmit :pending="login.isPending.value">
        {{ login.isPending.value ? "Logging in…" : "Log in" }}
      </AuthSubmit>
    </Form>
    <p class="text-muted-foreground text-center text-sm">
      New to the darkroom?
      <Link
        to="/auth/register"
        :search="{ redirect: props.redirect }"
        class="text-primary ml-1 text-xs font-semibold tracking-[0.12em] uppercase underline-offset-4 hover:underline"
      >
        Create an account
      </Link>
    </p>
  </AuthCard>
</template>

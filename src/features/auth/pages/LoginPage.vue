<script setup lang="ts">
import { Form, useForm } from "@formisch/vue";
import { Link, useRouter } from "@tanstack/vue-router";
import type * as v from "valibot";
import { computed } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import { errorMessage } from "#/shared/api/client";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/shared/ui/card";
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
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Welcome back</CardTitle>
      <CardDescription>Log in to your film tracker</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      <FormAlert v-if="googleError && !login.isError.value">{{ googleError }}</FormAlert>
      <GoogleSignIn :redirect="target" />
      <Form :of="form" class="grid gap-4" @submit="submit">
        <FormAlert v-if="login.isError.value">{{ errorMessage(login.error.value) }}</FormAlert>
        <FormInput
          :of="form"
          :path="['email']"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        />
        <div class="grid gap-1.5">
          <FormInput
            :of="form"
            :path="['password']"
            label="Password"
            type="password"
            autocomplete="current-password"
          />
          <Link
            to="/auth/recover"
            class="text-muted-foreground justify-self-end text-xs underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" class="w-full" :disabled="login.isPending.value">
          {{ login.isPending.value ? "Logging in…" : "Log in" }}
        </Button>
      </Form>
      <p class="text-muted-foreground text-center text-sm">
        No account yet?
        <Link
          to="/auth/register"
          :search="{ redirect: props.redirect }"
          class="text-foreground underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </CardContent>
  </Card>
</template>

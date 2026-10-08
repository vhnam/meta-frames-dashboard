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
import { useRegister } from "../queries";
import { PASSWORD_HINT, RegisterSchema } from "../schema";
import { safeRedirect } from "../session";

const props = defineProps<{ redirect?: string }>();

const router = useRouter();
const registerUser = useRegister();
const form = useForm({
  schema: RegisterSchema,
  initialInput: { name: "", email: "", password: "", confirmPassword: "" },
});
const target = computed(() => safeRedirect(props.redirect));

async function submit({ name, email, password }: v.InferOutput<typeof RegisterSchema>) {
  try {
    await registerUser.mutateAsync({ name, email, password });
  } catch {
    return; // shown inline
  }
  router.history.push(target.value);
}
</script>

<template>
  <AuthCard title="Create an account" description="Track every roll, from stock to scan.">
    <GoogleSignIn :redirect="target" />
    <Form :of="form" class="grid gap-5" @submit="submit">
      <FormAlert v-if="registerUser.isError.value">
        {{ errorMessage(registerUser.error.value) }}
      </FormAlert>
      <AuthInput
        :of="form"
        :path="['name']"
        label="Name"
        optional
        autocomplete="name"
        placeholder="e.g. Ansel"
      />
      <AuthInput
        :of="form"
        :path="['email']"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
      />
      <AuthInput
        :of="form"
        :path="['password']"
        label="Password"
        type="password"
        autocomplete="new-password"
        placeholder="At least 8 characters"
        :hint="PASSWORD_HINT"
      />
      <AuthInput
        :of="form"
        :path="['confirmPassword']"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        placeholder="Repeat the password"
      />
      <AuthSubmit :pending="registerUser.isPending.value">
        {{ registerUser.isPending.value ? "Creating account…" : "Create account" }}
      </AuthSubmit>
    </Form>
    <p class="text-muted-foreground text-center text-sm">
      Already have an account?
      <Link
        to="/auth/login"
        :search="{ redirect: props.redirect }"
        class="text-primary ml-1 text-xs font-semibold tracking-[0.12em] uppercase underline-offset-4 hover:underline"
      >
        Log in
      </Link>
    </p>
  </AuthCard>
</template>

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
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Create an account</CardTitle>
      <CardDescription>Track every roll, from stock to scan</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      <GoogleSignIn :redirect="target" />
      <Form :of="form" class="grid gap-4" @submit="submit">
        <FormAlert v-if="registerUser.isError.value">
          {{ errorMessage(registerUser.error.value) }}
        </FormAlert>
        <FormInput
          :of="form"
          :path="['name']"
          label="Name"
          optional
          autocomplete="name"
          placeholder="e.g. Ansel"
        />
        <FormInput
          :of="form"
          :path="['email']"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        />
        <FormInput
          :of="form"
          :path="['password']"
          label="Password"
          type="password"
          autocomplete="new-password"
          :hint="PASSWORD_HINT"
        />
        <FormInput
          :of="form"
          :path="['confirmPassword']"
          label="Confirm password"
          type="password"
          autocomplete="new-password"
        />
        <Button type="submit" class="w-full" :disabled="registerUser.isPending.value">
          {{ registerUser.isPending.value ? "Creating account…" : "Create account" }}
        </Button>
      </Form>
      <p class="text-muted-foreground text-center text-sm">
        Already have an account?
        <Link
          to="/auth/login"
          :search="{ redirect: props.redirect }"
          class="text-foreground underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </CardContent>
  </Card>
</template>

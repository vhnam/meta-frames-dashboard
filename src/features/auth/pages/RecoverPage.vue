<script setup lang="ts">
import { Form, useForm } from "@formisch/vue";
import { Link } from "@tanstack/vue-router";
import type * as v from "valibot";
import { errorMessage } from "#/shared/api/client";
import AuthCard from "../components/AuthCard.vue";
import AuthInput from "../components/AuthInput.vue";
import AuthSubmit from "../components/AuthSubmit.vue";
import FormAlert from "../components/FormAlert.vue";
import { useStartRecovery } from "../queries";
import { RecoverSchema } from "../schema";

const recover = useStartRecovery();
const form = useForm({ schema: RecoverSchema, initialInput: { email: "" } });

async function submit(o: v.InferOutput<typeof RecoverSchema>) {
  await recover.mutateAsync(o).catch(() => {}); // shown inline
}
</script>

<template>
  <AuthCard title="Forgot your password?" description="We will email you a link to set a new one.">
    <FormAlert v-if="recover.isSuccess.value" tone="success">
      {{ recover.data.value }}
      The link is valid for 24 hours.
    </FormAlert>
    <Form v-else :of="form" class="grid gap-5" @submit="submit">
      <FormAlert v-if="recover.isError.value">{{ errorMessage(recover.error.value) }}</FormAlert>
      <AuthInput
        :of="form"
        :path="['email']"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
      />
      <AuthSubmit :pending="recover.isPending.value">
        {{ recover.isPending.value ? "Sending…" : "Send reset link" }}
      </AuthSubmit>
    </Form>
    <p class="text-center">
      <Link
        to="/auth/login"
        class="text-primary text-xs font-semibold tracking-[0.12em] uppercase underline-offset-4 hover:underline"
      >
        Back to log in
      </Link>
    </p>
  </AuthCard>
</template>

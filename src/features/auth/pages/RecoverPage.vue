<script setup lang="ts">
import { Form, useForm } from "@formisch/vue";
import { Link } from "@tanstack/vue-router";
import type * as v from "valibot";
import FormInput from "#/shared/components/FormInput.vue";
import { errorMessage } from "#/shared/api/client";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/shared/ui/card";
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
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Forgot your password?</CardTitle>
      <CardDescription>We will email you a link to set a new one</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      <template v-if="recover.isSuccess.value">
        <FormAlert tone="success">
          {{ recover.data.value }}
          The link is valid for 24 hours.
        </FormAlert>
      </template>
      <Form v-else :of="form" class="grid gap-4" @submit="submit">
        <FormAlert v-if="recover.isError.value">{{ errorMessage(recover.error.value) }}</FormAlert>
        <FormInput
          :of="form"
          :path="['email']"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        />
        <Button type="submit" class="w-full" :disabled="recover.isPending.value">
          {{ recover.isPending.value ? "Sending…" : "Send reset link" }}
        </Button>
      </Form>
      <p class="text-center text-sm">
        <Link to="/auth/login" class="underline underline-offset-4">Back to log in</Link>
      </p>
    </CardContent>
  </Card>
</template>

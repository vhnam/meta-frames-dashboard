<script setup lang="ts">
import { Form, useForm } from "@formisch/vue";
import { Link, useRouter } from "@tanstack/vue-router";
import { isAxiosError } from "axios";
import type * as v from "valibot";
import { computed } from "vue";
import { toast } from "vue-sonner";
import FormInput from "#/shared/components/FormInput.vue";
import { errorMessage } from "#/shared/api/client";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/shared/ui/card";
import FormAlert from "../components/FormAlert.vue";
import { useResetPassword } from "../queries";
import { PASSWORD_HINT, ResetPasswordSchema } from "../schema";

const props = defineProps<{ token?: string }>();

const router = useRouter();
const reset = useResetPassword();
const form = useForm({
  schema: ResetPasswordSchema,
  initialInput: { password: "", confirmPassword: "" },
});
// unknown, used or expired token: the user needs a new email
const badToken = computed(
  () =>
    !props.token || (isAxiosError(reset.error.value) && reset.error.value.response?.status === 422),
);

async function submit({ password }: v.InferOutput<typeof ResetPasswordSchema>) {
  try {
    await reset.mutateAsync({ token: props.token ?? "", password });
  } catch {
    return; // shown inline
  }
  toast.success("Password changed. Log in with your new password.");
  await router.navigate({ to: "/auth/login" });
}
</script>

<template>
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Set a new password</CardTitle>
      <CardDescription>Every other session of your account will be logged out</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      <template v-if="badToken">
        <FormAlert>
          {{
            props.token ? errorMessage(reset.error.value) : "This reset link is missing its token."
          }}
          Request a new link to continue.
        </FormAlert>
        <Button as-child class="w-full">
          <Link to="/auth/recover">Request a new link</Link>
        </Button>
      </template>
      <Form v-else :of="form" class="grid gap-4" @submit="submit">
        <FormAlert v-if="reset.isError.value">{{ errorMessage(reset.error.value) }}</FormAlert>
        <FormInput
          :of="form"
          :path="['password']"
          label="New password"
          type="password"
          autocomplete="new-password"
          :hint="PASSWORD_HINT"
        />
        <FormInput
          :of="form"
          :path="['confirmPassword']"
          label="Confirm new password"
          type="password"
          autocomplete="new-password"
        />
        <Button type="submit" class="w-full" :disabled="reset.isPending.value">
          {{ reset.isPending.value ? "Saving…" : "Change password" }}
        </Button>
      </Form>
      <p class="text-center text-sm">
        <Link to="/auth/login" class="underline underline-offset-4">Back to log in</Link>
      </p>
    </CardContent>
  </Card>
</template>

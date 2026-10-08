<script setup lang="ts" generic="TSchema extends FormSchema, TPath extends RequiredPath">
import { Field } from "@formisch/vue";
import type { FormSchema, FormStore, RequiredPath, ValidPath } from "@formisch/vue";
import { IconEye, IconEyeOff } from "@tabler/icons-vue";
import type * as v from "valibot";
import { computed, ref, useId } from "vue";
import { Input } from "#/shared/ui/input";

const props = defineProps<{
  of: FormStore<TSchema>;
  path: ValidPath<v.InferInput<TSchema>, TPath>;
  label: string;
  optional?: boolean;
  hint?: string;
  type?: string;
  placeholder?: string;
  autocomplete?: string;
}>();

const id = useId();
const shown = ref(false);
const isPassword = computed(() => props.type === "password");
const inputType = computed(() => (isPassword.value && shown.value ? "text" : props.type));
</script>

<template>
  <Field :of="of" :path="path" v-slot="field">
    <div class="grid content-start gap-2">
      <label :for="id" class="text-xs font-semibold tracking-[0.12em] uppercase">
        {{ label }}
        <span v-if="optional" class="text-muted-foreground">(optional)</span>
      </label>
      <div class="relative">
        <Input
          :id="id"
          :model-value="field.input as string | undefined"
          v-bind="field.props"
          :type="inputType"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :aria-invalid="!!field.errors"
          class="font-heading h-11 px-3.5 text-base md:text-base"
          :class="{ 'pr-11': isPassword }"
          @update:model-value="(x) => (field.input = x as never)"
        />
        <button
          v-if="isPassword"
          type="button"
          class="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md outline-none focus-visible:ring-3"
          :aria-label="shown ? 'Hide password' : 'Show password'"
          :aria-pressed="shown"
          @click="shown = !shown"
        >
          <component :is="shown ? IconEyeOff : IconEye" class="size-5" aria-hidden="true" />
        </button>
      </div>
      <p v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
      <p v-if="field.errors" class="text-destructive text-xs" role="alert">
        {{ field.errors[0] }}
      </p>
    </div>
  </Field>
</template>

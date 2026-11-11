<script setup lang="ts">
import { useSetRollPlan } from "../queries";
import type { RollPlan, StepActor } from "../types";
import Select from "#/shared/components/Select.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ rollId: string; plan: RollPlan }>();
const setPlan = useSetRollPlan();

const TARGET_OPTIONS = [
  { value: "developed", label: "Develop only" },
  { value: "scanned", label: "Develop + scan" },
];
const ACTOR_OPTIONS = [
  { value: "self", label: "At home" },
  { value: "lab", label: "Lab" },
];

/** Saves the whole plan; "develop only" drops the scanner, which the API refuses with it. */
function save(change: Partial<RollPlan>) {
  const plan = { ...props.plan, ...change };
  if (plan.target === "developed") plan.scanBy = null;
  // on failure the fields keep showing the saved plan
  void attempt(setPlan.mutateAsync({ rollId: props.rollId, plan }));
}
/** The select's "Not decided" is an empty string; the plan stores null. */
const picked = <TValue extends string>(value: string) => (value || null) as TValue | null;
const setTarget = (value: string) => save({ target: picked<"developed" | "scanned">(value) });
const setDevelopBy = (value: string) => save({ developBy: picked<StepActor>(value) });
const setScanBy = (value: string) => save({ scanBy: picked<StepActor>(value) });
</script>

<template>
  <dl class="grid gap-x-5 gap-y-3 sm:grid-cols-3">
    <div class="grid gap-1.5">
      <dt class="text-muted-foreground text-xs">Goal</dt>
      <dd>
        <Select
          :model-value="plan.target ?? ''"
          aria-label="Goal"
          placeholder="Not decided"
          :options="TARGET_OPTIONS"
          :disabled="setPlan.isPending.value"
          @update:model-value="setTarget"
        />
      </dd>
    </div>
    <div class="grid gap-1.5">
      <dt class="text-muted-foreground text-xs">Develop by</dt>
      <dd>
        <Select
          :model-value="plan.developBy ?? ''"
          aria-label="Develop by"
          placeholder="Not decided"
          :options="ACTOR_OPTIONS"
          :disabled="setPlan.isPending.value"
          @update:model-value="setDevelopBy"
        />
      </dd>
    </div>
    <div class="grid gap-1.5">
      <dt class="text-muted-foreground text-xs">Scan by</dt>
      <dd>
        <Select
          :model-value="plan.scanBy ?? ''"
          aria-label="Scan by"
          placeholder="Not decided"
          :options="ACTOR_OPTIONS"
          :disabled="setPlan.isPending.value || plan.target === 'developed'"
          @update:model-value="setScanBy"
        />
      </dd>
    </div>
  </dl>
</template>

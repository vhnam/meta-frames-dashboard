// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { nextTick } from "vue";
import { ask } from "#/shared/lib/ui";
import ConfirmDialog from "./ConfirmDialog.vue";

const button = (name: string) =>
  [...document.body.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)!;

async function open(message: string) {
  const answer = ask(message);
  await nextTick();
  await nextTick();
  return answer;
}

describe("ConfirmDialog", () => {
  mount(ConfirmDialog, { attachTo: document.body });
  afterEach(async () => {
    // close anything left open
    void ask("");
    button("Cancel")?.click();
    await nextTick();
  });

  it("shows the question and resolves true on Delete", async () => {
    const answer = open("Delete this roll?");
    await nextTick();
    expect(document.body.textContent).toContain("Delete this roll?");
    button("Delete").click();
    await expect(answer).resolves.toBe(true);
  });

  it("resolves false on Cancel", async () => {
    const answer = open("Delete this lens?");
    await nextTick();
    button("Cancel").click();
    await expect(answer).resolves.toBe(false);
  });

  it("resolves an earlier question false when a new one opens", async () => {
    const first = ask("Delete this lab?");
    void ask("Delete this camera?");
    await expect(first).resolves.toBe(false);
  });
});

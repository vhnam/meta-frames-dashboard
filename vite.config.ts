import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      // no single-character names (AGENTS.md > Naming); "_" marks an unused parameter and "v" is
      // the valibot namespace import (`import * as v`)
      "id-length": ["error", { min: 2, exceptions: ["_", "v"], properties: "never" }],
    },
    options: { typeAware: true, typeCheck: true },
  },
  // staged-file checks for the pre-commit hook (.vite-hooks/pre-commit runs `vp staged`)
  staged: {
    "*.{ts,js,vue,css,json,md,yaml,yml}": "vp check --fix",
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "#": path.resolve(__dirname, "./src"),
    },
  },
});

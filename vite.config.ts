import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: [tanstackRouter({ target: "vue", autoCodeSplitting: true }), vue(), tailwindcss()],
  resolve: {
    alias: {
      "#": path.resolve(__dirname, "./src"),
    },
  },
});

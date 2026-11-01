import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

/** Validated environment variables. Fails fast at startup when one is missing or malformed. */
export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: v.optional(v.pipe(v.string(), v.url()), "http://localhost:8080"),
  },
  runtimeEnv: import.meta.env,
  // treat `VITE_API_URL=` in `.env` as unset, so the default applies
  emptyStringAsUndefined: true,
});

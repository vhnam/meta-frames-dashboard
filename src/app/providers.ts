import { VueQueryPlugin } from '@tanstack/vue-query';
import type { App } from 'vue';
import { toast } from 'vue-sonner';

import { queryClient } from '#/shared/api/client';

/** A fixed id makes a repeated error replace the toast instead of stacking a new one. */
const UNEXPECTED_ERROR_TOAST_ID = 'unexpected-error';

/** Logs an unexpected error and shows one toast for it. */
export function reportUnexpectedError(error: unknown, info: string) {
  // a custom handler replaces Vue's default console output, so keep the log
  console.error(error, info);
  toast.error('Something went wrong. Reload the page if it keeps happening.', {
    id: UNEXPECTED_ERROR_TOAST_ID,
    action: { label: 'Close', onClick: () => undefined },
  });
}

/** Installs app-wide plugins (server state, ...) and the handler for unexpected errors. */
export function installProviders(app: App) {
  app.use(VueQueryPlugin, { queryClient });
  // Query and mutation errors have their own UI; this catches render, hook and event errors.
  app.config.errorHandler = (error, _instance, info) => reportUnexpectedError(error, info);
}

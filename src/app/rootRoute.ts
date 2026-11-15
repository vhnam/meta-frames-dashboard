import { createRootRoute } from '@tanstack/vue-router';

import NotFoundPage from '#/layouts/root/NotFoundPage.vue';
import RootLayout from '#/layouts/root/RootLayout.vue';
import { parseListSearch } from '#/shared/lib/listSearch';

export const rootRoute = createRootRoute({
  component: RootLayout,
  validateSearch: parseListSearch,
  notFoundComponent: NotFoundPage,
});

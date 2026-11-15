import { createRootRoute } from '@tanstack/vue-router';

import NotFoundPage from '#/layouts/NotFoundPage.vue';
import RootLayout from '#/layouts/RootLayout.vue';
import { parseListSearch } from '#/shared/lib/listSearch';

export const rootRoute = createRootRoute({
  component: RootLayout,
  validateSearch: parseListSearch,
  notFoundComponent: NotFoundPage,
});

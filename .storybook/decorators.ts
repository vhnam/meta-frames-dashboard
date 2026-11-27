import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/vue-router';
import type { Decorator } from '@storybook/vue3-vite';
import { defineComponent, h, watchEffect } from 'vue';

// Toggle `.dark` directly: `#/shared/lib/theme` writes localStorage and follows the OS.
export const withTheme: Decorator = (story, context) =>
  defineComponent({
    setup() {
      watchEffect(() => {
        const dark = context.globals.theme === 'dark';
        document.documentElement.classList.toggle('dark', dark);
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      });
      return () => h(story());
    },
  });

// Memory-history router with a catch-all route that renders the story, so `<Link>` works.
export const withRouter: Decorator = (story) =>
  defineComponent({
    setup() {
      const rootRoute = createRootRoute();
      const storyRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/$',
        component: () => h(story()),
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([storyRoute]),
        history: createMemoryHistory({ initialEntries: ['/'] }),
      });
      return () => h(RouterProvider, { router });
    },
  });

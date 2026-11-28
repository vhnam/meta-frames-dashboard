/// <reference types="vite/client" />
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { setup } from '@storybook/vue3-vite';
import type { Preview } from '@storybook/vue3-vite';
import 'vue-sonner/style.css';

import '#/styles/index.css';

import { withRouter, withTheme } from './decorators';

setup((app) => {
  app.use(VueQueryPlugin, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    }),
  });
});

const preview: Preview = {
  decorators: [withRouter, withTheme],
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

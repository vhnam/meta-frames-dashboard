import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: [
    { directory: '../src/shared/ui', files: '**/*.stories.ts', titlePrefix: 'UI' },
    {
      directory: '../src/shared/components',
      files: '**/*.stories.ts',
      titlePrefix: 'Components',
    },
    { directory: '../src/features', files: '**/*.stories.ts', titlePrefix: 'Features' },
  ],
  addons: ['@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/vue3-vite',
};
export default config;

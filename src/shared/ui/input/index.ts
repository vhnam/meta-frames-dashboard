import { cva } from 'class-variance-authority';

export { default as Input } from './Input.vue';

// Box shared by Input and the combobox inputs. Callers add their own padding.
export const inputBoxClasses =
  'h-9 w-full min-w-0 rounded-md border border-input bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30';

// Focus ring and invalid state shared by every text-entry control.
export const inputFocusVariants = cva('', {
  variants: {
    focus: {
      visible:
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
      within: 'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
    },
  },
  defaultVariants: { focus: 'visible' },
});

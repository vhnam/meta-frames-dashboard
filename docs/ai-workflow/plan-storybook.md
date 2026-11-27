# Plan: Storybook for all dashboard components

Repository: `meta-frames-dashboard`. Author: Opus (tech lead). Status: waiting for Nam's approval.

## Track

Full-Track by file count (more than 3 files). There is no Astra spec: this change has no data flow, API contract or schema. Nam approves this skip together with the plan.

No story ships to production. No `CHANGELOG.md` entry (dev tooling only, not user-facing).

## Current state (2026-11-27)

- Nam installed `storybook`, `@storybook/vue3-vite`, `@storybook/addon-docs`, `@storybook/addon-vitest` 10.6.9 and added the `storybook` and `build-storybook` scripts. These changes are unstaged.
- `storybook init` stopped with `EBADDEVENGINES` (it called npm, the repo requires pnpm). See `debug-storybook.log`.
- `.storybook/main.ts` lists `@chromatic-com/storybook` and `@storybook/addon-a11y`. Neither package is installed, so Storybook does not start.
- `.storybook/preview.ts` loads no app CSS, no providers and no theme.
- `src/stories/` holds only init boilerplate: `Configure.mdx`, `button.css`, `header.css`, `page.css`, `assets/`.

## Decisions

1. **Story location:** colocate `<Name>.stories.ts` next to the component, as the repo colocates `*.test.ts`.
2. **One story file per component group.** A shadcn group (for example `src/shared/ui/dialog/*`) gets one file that composes its parts. A shared or feature component gets one file.
3. **Titles:** automatic from the path, with `titlePrefix` per directory in `main.ts`: `UI` (`src/shared/ui`), `Components` (`src/shared/components`), `Features` (`src/features`). No explicit `title` in the story files.
4. **Addons:** keep `@storybook/addon-docs`. Add `@storybook/addon-a11y` (the repo already scans pages with axe). Remove `@chromatic-com/storybook` (no Chromatic account in use). Keep `@storybook/addon-vitest` installed but do not wire story tests into `vp test` (out of scope).
5. **Global setup in `preview.ts`:**
   - Import `#/styles/index.css` and `vue-sonner/style.css`.
   - `setup(app)`: install `VueQueryPlugin` with a new `QueryClient` (`retry: false`, `staleTime: Infinity`). Do not use the app `queryClient` from `#/shared/api/client`.
   - A theme toolbar global (`light` / `dark`) and a decorator that toggles the `.dark` class on `document.documentElement`. Do not import `#/shared/lib/theme` (it writes `localStorage` and follows the OS).
   - A router decorator: a TanStack Vue Router with memory history and one catch-all route that renders the story, so components with `<Link>` render. Reuse it in every story; no per-story router.
6. **Data-coupled feature components** (they call `use*List` / `use*Detail` or mutations): seed the story `QueryClient` with `setQueryData` under the feature's existing query keys (`rollKeys`, `cameraKeys`, and so on). No network, no MSW, no new mock layer. A story does not submit a mutation.
7. **Form components** (`FormInput`, `FormSelect`, and so on) take a formisch `FormStore`: each story creates one with `useForm` and a small valibot schema inside `render`.
8. **Fixtures:** typed inline objects in each story file. If 3 or more story files in one feature need the same object, put it in `src/features/<feature>/stories.fixtures.ts`.

## Rules for every slice

- Follow repo rules: `id-length` (no single-character names), design tokens only (no raw palette class, no `oklch(`, no hex), `#/` imports.
- Use `Meta` / `StoryObj` from `@storybook/vue3-vite`. Type the meta with the component's props: `satisfies Meta<Props>`. Use the props type that the component's `index.ts` exports when one exists (for example `ButtonVariants`). Otherwise write an inline props type. Do not use `Meta<typeof Component>`: the `*.vue` shim in `src/env.d.ts` types every component as `DefineComponent<object>`, and `vp check` fails. Slice 1 `Button.stories.ts` is the reference.
- A story shows the component states (for example default, disabled, invalid, empty, loading). No assertions or play functions.
- Checks: `vp check` exit 0, `vp test` exit 0, `pnpm build-storybook` exit 0 with no story errors. Open `pnpm storybook` and confirm every new story renders in light and dark with no console error.
- Do not edit a component to make a story work. If a component cannot render in Storybook without a change, stop and report it.

## In scope

- Storybook config, global decorators, cleanup of init boilerplate.
- Stories for every component group in `src/shared/ui`, `src/shared/components`, `src/features/*/components`.

## Out of scope

- Pages (`src/features/*/pages`), layouts (`src/layouts`), `src/app`.
- Story tests in `vp test` (`@storybook/addon-vitest` wiring), visual regression, Chromatic, CI jobs.
- MSW or any other new mock dependency.
- Changes to component source.
- Storybook docs pages (MDX) other than autodocs.

## Slices

Each slice: repository `meta-frames-dashboard`, executor Sonnet, plus `docs/progress.md` in the workspace root.

### Slice 1: config and wiring

Allowed files:

- `.storybook/main.ts`, `.storybook/preview.ts`, new `.storybook/decorators.ts` if the router and theme decorators make `preview.ts` long.
- `package.json`, `pnpm-lock.yaml` (add `@storybook/addon-a11y` 10.6.9 with `pnpm add -D`).
- `.gitignore` (add `storybook-static` and `debug-storybook.log`).
- Delete `src/stories/` and `debug-storybook.log`.
- `src/shared/ui/button/Button.stories.ts` (proof that styles, theme and autodocs work).

Acceptance: `pnpm storybook` starts. Button story renders with app fonts and tokens in light and dark. a11y panel shows results. `pnpm build-storybook` exit 0.

### Slice 2: `src/shared/ui` part A

Groups: `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `card`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `empty`, `input`, `label`.
Allowed files: `src/shared/ui/<group>/<Group>.stories.ts` for these groups.

### Slice 3: `src/shared/ui` part B

Groups: `pagination`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`.
Allowed files: `src/shared/ui/<group>/<Group>.stories.ts` for these groups.

### Slice 4: `src/shared/components` display

`add-button`, `brand-link`, `confirm-dialog`, `data-table`, `detail-hero`, `empty-state`, `not-found`, `page-header`, `plain-dialog`, `query-boundary`, `quick-picks`, `rich-text`, `spec-tile`, `status-badge`.
Allowed files: `src/shared/components/<dir>/<Name>.stories.ts` for these directories.

### Slice 5: `src/shared/components` forms

`creatable-combobox`, `form-combobox`, `form-field`, `form-input`, `form-rich-text`, `form-section`, `form-select`, `rich-text-editor`, `searchable-select`, `sectioned-form-dialog`, `select`.
Allowed files: `src/shared/components/<dir>/<Name>.stories.ts` for these directories.

### Slice 6: features `audit`, `auth`, `scans`, `scanners`

`audit-action-badge`, `audit-log-sheet`, `auth-card`, `auth-input`, `auth-layout`, `auth-submit`, `form-alert`, `google-sign-in`, `compare-scans-dialog`, `import-scans-dialog`, `scan-image`, `scan-settings-fields`, `scanner-form-dialog`.
Allowed files: `<Name>.stories.ts` in those component directories, plus `src/features/<feature>/stories.fixtures.ts` for these features under Decision 8.
Risk: `GoogleSignIn` loads the Google script. If it does not render offline, show its fallback state only.

### Slice 7: features `cameras`, `lenses`, `film-stocks`, `labs`, `lab-orders`

`camera-form-dialog`, `manage-lenses-dialog`, `lens-form-dialog`, `stock-form-dialog`, `lab-form-dialog`, `lab-scanner-picker`, `add-roll-to-order-dialog`, `lab-order-form-dialog`, `order-lines-picker`.
Allowed files: as slice 6, for these features.

### Slice 8: feature `rolls` display

`frames-card`, `in-stock-groups`, `in-stock-toolbar`, `processing-history-card`, `processing-jobs`, `roll-gear-card`, `roll-plan-fields`, `roll-stage-badge`, `roll-status-badge`, `roll-summary-card`, `scan-order-picker`.
Allowed files: `<Name>.stories.ts` in those directories, `src/features/rolls/stories.fixtures.ts`.

### Slice 9: feature `rolls` dialogs

`add-rolls-dialog`, `finish-roll-dialog`, `hand-over-dialog`, `load-roll-dialog`, `mark-developed-dialog`, `return-negatives-dialog`, `roll-edit-dialog`, `roll-lenses-dialog`, `send-to-lab-dialog`.
Allowed files: `<Name>.stories.ts` in those directories, `src/features/rolls/stories.fixtures.ts`.

Dependency order: slice 1 first. Slices 2 to 9 depend only on slice 1. Slice 9 reuses fixtures from slice 8, so run 8 before 9.

## Risks

- **Env validation:** `#/shared/api` imports `@t3-oss/env-core`. Storybook reads `.env` from the repo root through the Vite config. If the env check throws in Storybook, report it in slice 1. Do not change env code in this plan.
- **Vite+ config:** Storybook loads `vite.config.ts` (Vite+ `defineConfig`). If the merge fails, slice 1 sets `viteFinal` in `main.ts` with the `vue()` and `tailwindcss()` plugins and the `#` alias.
- **Package manager:** run Storybook commands with `pnpm`, not `npm` or `npx` (`devEngines` requires pnpm 12.21.0).

## Reuse analysis

- Existing patterns reviewed: colocated tests, feature query keys, `useForm` with valibot schemas, TanStack Router setup in `src/app/router.ts`.
- Chosen approach: Reuse. Seed data with existing query keys. One shared router and theme decorator in `.storybook`.
- Duplication risk: Low. Fixtures move to one file per feature when 3 or more stories share them.

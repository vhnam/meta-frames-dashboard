# Storybook slice 4 review, round 1

What this change does:
The change adds 43 stories for 14 shared components.
The stories show component states with local data, the story router, and the story QueryClient.

## [WARN]

1. **Selectable does not follow Controls.** `src/shared/components/data-table/DataTable.stories.ts:105`
   - What this is: The story stores the selected row in `selectedId`. A row click changes that value.
   - Problem: The story copies `args.selectedRowId` only during setup. The template then overrides that arg with `selectedId`.
   - Evidence: Click the Fujifilm row, then set `selectedRowId` to `roll-4` in Controls. The Fujifilm row stays selected.
     The same steps fail in light and dark. Real clicks, sorting, and filters work.
   - Fix: Watch `args.selectedRowId` and copy each change to `selectedId`, as the brief requires.
   - If we skip it: Controls and the canvas show different selected rows.

2. **ConfirmDialog docs open two dialogs.** `src/shared/components/confirm-dialog/ConfirmDialog.stories.ts:15`
   - What this is: The docs page renders the primary example and the Trigger example. Each example mounts `ConfirmDialog`.
   - Problem: Both instances read the same `pendingAsk` value. One click on Delete roll opens two alert dialogs.
   - Evidence: The docs page shows two copies of the message, Cancel button, and Delete button in both themes.
     Both modal instances also hide other content from the accessibility tree.
   - Fix: Exclude this singleton component from autodocs, as the Sonner fix does. Keep both canvas stories.
   - If we skip it: The docs page gives overlapping dialogs and competing modal behavior after one click.

## [NIT]

3. **WithSub shows an incorrect format value.** `src/shared/components/spec-tile/SpecTile.stories.ts:23`
   - What this is: WithSub changes the label to Format and adds an exposure count.
   - Problem: The shared render still shows `400`. The example shows Format 400 instead of a film format.
   - Fix: Keep the Box ISO label, or give this story a format value such as `35mm`.
   - If we skip it: The example does not meet the brief's realistic-data requirement.

## Pre-existing component issue

- [WARN] **RichText has no accessible name.** `src/shared/components/rich-text/RichText.vue:15`
  The a11y panel reports `aria-input-field-name` on `.tiptap` in PlainText and Formatted, in both themes.
  The details identify a read-only element with `role="textbox"` and no accessible name.
  The component sets editor attributes without a name. The story only supplies markdown.
  This issue predates the slice. It does not affect this verdict. Keep its fix outside this slice.

## Checks

- Reviewed the plan, the brief, component source, and feature or layout examples.
  Reviewed all 14 new story files, the staged diff, the working diff, and untracked paths.
  No staged or tracked source change exists. No slice file exceeds the allowed scope.
  Workflow documents remain outside this code review, as requested.
- All metas use props types. StatusBadge options match the component tones.
  No new dependency, shared fixture, play function, assertion, single-character name, or raw color occurs in these stories.
- Reused the progress entry checks after matching HEAD and all 14 full SHA-256 values.
  HEAD: `d3496923dac2a044c5759d22408735f32f34dc51`.
  The story hashes still matched after browser checks.
  - `vp check src .storybook`: exit 0. Format, lint, and types pass.
  - `vp test`: exit 0. All 299 tests in 68 files pass.
  - `pnpm build-storybook`: exit 0. The recorded index contains all 43 new stories.
- Ran `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6020`.
  Opened all 43 stories in light and dark. Opened all 14 docs pages.
  No console error occurred. Stopped this server and checked that port 6020 had no listener.
- Read the a11y panel for every canvas story in both themes.
  Only RichText reports a violation in the initial states.
  The three open PlainDialog stories each report one inconclusive `aria-hidden-focus` result, with zero violations.
- Used real clicks for DataTable sorting, text search, the Format filter, row selection, and pagination.
  Pagination reached `11-20 of 25`. Navigation to Rows restored `1-6 of 6` and cleared filters.
- Used the Controls panel for Selectable, QuickPicks, PlainDialog, and QueryBoundary.
  QuickPicks keeps click state and follows Controls in both themes.
  PlainDialog opens through its trigger and Controls. Save closes the dialog.
  Navigation from open dialogs leaves no dialog or body scroll lock. The next trigger remains usable.
- QueryBoundary uses real `useQuery` calls with local promise results and state-specific query keys.
  Controls correctly select loading, error, empty, and success. Story navigation does not retain the previous result.
  The query functions contain no network request.
- Clicked ConfirmDialog Delete in both themes. The dialog closes without a console error.
  Source inspection shows that Delete only resolves the local confirmation promise. It makes no network request.
- Wrote no unit tests. These stories contain no business rules.

Lean: -0 lines possible.

Verdict: request changes

## Round 2

The fix adds a watcher for row selection, excludes ConfirmDialog from autodocs, and fixes the WithSub sample.
The changes follow the fix brief. The round 1 text remains above.

### Round 1 findings

- [WARN] 1: Resolved. `src/shared/components/data-table/DataTable.stories.ts:107`
  The watcher copies each `args.selectedRowId` change to `selectedId`.
  In both themes, a real click selected Fujifilm. Controls `selectedRowId=roll-4` then selected Kodak Tri-X.
  A later real click selected Ilford. The Controls entry remains available.
- [WARN] 2: Resolved. `src/shared/components/confirm-dialog/ConfirmDialog.stories.ts:16`
  The meta now uses `tags: ['!autodocs']`. The sidebar contains no ConfirmDialog Docs link.
  In both themes, one Trigger click opened one alert dialog. Open also mounted one alert dialog.
  Delete and Cancel closed their dialogs without console errors.
- [NIT] 3: Resolved. `src/shared/components/spec-tile/SpecTile.stories.ts:23`
  WithSub shows Box ISO, 400, and Rated at box speed in both themes.
  The value now matches the label.

### New findings

No new [CRITICAL], [WARN], or [NIT] finding.
The pre-existing RichText issue remains outside this fix. It does not affect this verdict.

### Checks

- Reviewed all three changed files against the fix brief and the round 1 review.
  Only those three story hashes differ from the round 1 evidence. The other 11 story hashes still match.
  The staged and working diffs contain no tracked change. No component source or dependency changed.
  The fix adds no single-character name, raw palette class, `oklch(`, or hex color.
- Reused the latest slice 4 fix round 1 results after matching HEAD and all three full SHA-256 values.
  HEAD: `d3496923dac2a044c5759d22408735f32f34dc51`.
  - `vp check src .storybook`: exit 0. Format, lint, and types pass.
  - `vp test`: exit 0. All 299 tests in 68 files pass.
  - `pnpm build-storybook`: exit 0.
  - `DataTable.stories.ts`: `ddd8d691f2c43fd763c0059b67640a36c8ead726c404cbf2e74946507be8dbae`.
  - `ConfirmDialog.stories.ts`: `3e25b9e2a3599dd2da892187631cafd56b1320c17a8a6549a47e5e222b65395b`.
  - `SpecTile.stories.ts`: `9f459a8fe27b31e8c8acfe2870960613026d08f35393ec4782478fb3e7778eb2`.
- Ran `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6022`.
  Used real clicks and the Controls panel UI for the selection checks in both themes.
  Checked Trigger, Open, and WithSub in both themes. No console error occurred.
- Checked DataTable sorting, text search, and the Format filter with real clicks.
  Sorting placed Fujifilm first. Search for Velvia kept one row. Format 120 kept two rows.
  Paginated reached `11-20 of 25`. Navigation to Rows restored `1-6 of 6` and cleared filters.
  Empty showed the empty state. No console error occurred.
- The a11y panel reports zero violations for Selectable, Trigger, and Open in both themes.
  WithSub reports zero violations in dark theme. Its light theme text also renders correctly.
- Stopped this server. `lsof -nP -iTCP:6022 -sTCP:LISTEN` returned no listener.
  HEAD and all story hashes still matched after the browser checks.
- Wrote no unit tests. These changes only affect stories.

Lean: -0 lines possible.

Verdict: approve

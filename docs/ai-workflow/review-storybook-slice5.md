# Storybook slice 5 review, round 1

What this change does:
The change adds 54 stories for 11 shared form components.
The stories use local values, formisch stores, and valibot schemas without application mutations.

## [WARN]

1. **Invalid form stories keep errors after valid input.** `src/shared/components/form-input/FormInput.stories.ts:30`
   - What this is: The Invalid stories call `validate(form)` during setup to show real schema errors.
   - Problem: These calls do not mark the form as submitted. The default validation mode therefore prevents later input from clearing errors.
   - Evidence: Type Nikon FM2 in FormInput Invalid. The field keeps Camera model is required after typing and blur.
     FormCombobox keeps Mount is required after Nikon F. FormSelect keeps Film format is required after selecting 120.
     InvalidSearchable has the same problem. FormRichText keeps Description is required after typing valid notes.
     SectionedFormDialog also keeps its initial error after a valid name.
   - Cause: Installed formisch source sets `validate` to `submit` and `revalidate` to `input` by default.
     `validate()` only calls the schema validator. `handleSubmit()` also sets `isSubmitted=true`.
     The field input setter selects revalidation only after submission under these defaults.
     See `node_modules/@formisch/vue/dist/internals.js:612`, `internals.js:890`, and `dist/index.js:124`, `index.js:425`, `index.js:481`.
   - Feature comparison: `src/features/labs/components/lab-form-dialog/LabFormDialog.vue:23` uses the defaults with SectionedFormDialog's real Form submission.
     In the story, an empty submit followed by valid typing clears the error. The initial setup causes the difference.
   - Fix: Use initial validation for these Invalid stores, with input revalidation. Keep the real schema errors.
   - Other affected paths:
     - `src/shared/components/form-combobox/FormCombobox.stories.ts:29`
     - `src/shared/components/form-select/FormSelect.stories.ts:28`
     - `src/shared/components/form-rich-text/FormRichText.stories.ts:27`
     - `src/shared/components/sectioned-form-dialog/SectionedFormDialog.stories.ts:34`
   - If we skip it: Valid input still appears invalid. Standalone field stories provide no submit action to clear that error.

## [NIT]

2. **The dialog ignores the size control.** `src/shared/components/sectioned-form-dialog/SectionedFormDialog.stories.ts:40`
   - What this is: The story binds `args`, then sets `size="md"` directly.
   - Problem: The direct attribute overrides the size arg. The supported large size cannot render through Controls.
   - Evidence: Set size to `"lg"` in the Controls JSON editor. The dialog keeps `sm:max-w-2xl` and width 672 pixels.
   - Fix: Set the default size in meta args. Remove the direct size attribute so Controls can change it.
   - If we skip it: The size control has no effect, and every dialog story shows only the medium size.

## Pre-existing component issue

- [WARN] **Disabled editor text has insufficient contrast in light theme.** `src/shared/components/rich-text-editor/RichTextEditor.vue:174`
  The component applies `data-[disabled]:opacity-50` to the editor container.
  The a11y panel reports `color-contrast` on `.tiptap > p` in RichTextEditor Disabled and FormRichText Disabled.
  RichTextEditor reports 3.35:1 against a required 4.5:1. Both disabled stories pass the violation check in dark theme.
  FormRichText uses this same editor component. The stories do not add the opacity rule.
  This issue predates the slice. Keep its fix outside this slice. It does not affect this verdict.

## Checks

- Reviewed the plan, the brief, all 11 story files, component source, and feature compositions.
  Each FormStore belongs to its story setup. Each value component keeps local state and watches its model arg.
  FormField and FormSection do not take FormStore props. Their direct slot examples match those component interfaces.
- Checked staged changes, working changes, and untracked paths. Only the 11 allowed story files add source.
  No component source, dependency, shared fixture, assertion, or play function changed.
  No forbidden single-character name, raw palette class, `oklch(`, or hex color occurs in the stories.
  Workflow documents remain outside this code review, as requested.
- Matched HEAD `5cbde807f90bd765c54247187f56b689433a3975` and all 11 full SHA-256 values against the latest slice 5 progress entry.
  Reused its passing results:
  - `vp check src .storybook`: exit 0.
  - `vp test`: exit 0. All 299 tests in 68 files pass.
  - `pnpm build-storybook`: exit 0. The recorded index contains 54 new stories.
- Ran `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6024`.
  Opened all 54 stories in light and dark. Each theme matched the document's dark class.
  Read the a11y panel for all 108 cases. Only the two known light-theme disabled editor stories report violations.
  Opened all 10 available docs pages. No docs page mounted a dialog. No console error occurred.
- Changed modelValue through the Controls panel in every value story, including Disabled, in both themes.
  All 32 checks updated the canvas. RichTextEditor also updated its markdown output.
- Used real typing and clicks to create L39 in CreatableCombobox and M42 in FormCombobox.
  Each field kept its created value. Navigation to another story showed only the original options.
  Real search and selection worked in SearchableSelect and Select.
- Typed `**bold**` with real keys in RichTextEditor and FormRichText, in both themes.
  Each editor rendered a strong element. Each markdown output showed `**bold**`.
- Checked Pending, ReadOnly, and Invalid visually in both themes.
  Pending disables submit. ReadOnly shows Close without submit. Invalid shows the real schema error.
  Trigger opens one dialog. Successful submit closes it in both themes without a console error.
  Source inspection shows that submit only changes the local open value. It makes no network request.
- Stopped this server. `lsof -nP -iTCP:6024 -sTCP:LISTEN` returned no listener.
  Wrote no unit tests. These stories contain no business rules.

Lean: -0 lines possible.

Verdict: request changes

## Round 2

The fix changes the Invalid stores to initial validation and lets the dialog size follow its arg.
The round 1 text remains above.

### Round 1 findings

- [WARN] 1: Resolved.
  - `src/shared/components/form-input/FormInput.stories.ts:32`
  - `src/shared/components/form-combobox/FormCombobox.stories.ts:31`
  - `src/shared/components/form-select/FormSelect.stories.ts:30`
  - `src/shared/components/form-rich-text/FormRichText.stories.ts:29`
  - `src/shared/components/sectioned-form-dialog/SectionedFormDialog.stories.ts:30`

  Every Invalid store now uses `validate: 'initial'`. Other stores use `validate: 'submit'`.
  Input revalidation remains the installed default.
  `node_modules/@formisch/vue/dist/index.js:562` runs initial validation before mount.
  `node_modules/@formisch/vue/dist/internals.js:613` sets the input revalidation default.
  Its `validateIfRequired` function selects that mode for initial validation at `internals.js:890`.

  Real typing and clicks passed the validation cycle in light and dark for all six Invalid stories.
  The initial schema error appeared. A valid value cleared the error. An empty value restored the error.
  FormSelect InvalidSearchable also passed.

  Select clearing needs a qualification. Required Select does not offer an empty choice.
  SearchableSelect restores its selected label when the user clears search text and leaves the field.
  A direct check restored 120 medium format with no error, because the selected value did not change.
  These component behaviors predate the fix.
  For the empty-value test, Controls `optional=true` exposed Select's empty choice.
  For InvalidSearchable, Controls `searchable=false` temporarily exposed that same choice.
  Picking the placeholder restored the schema error. Restoring `searchable=true` kept the empty field and error.
  These Controls steps passed in both themes. No component change was necessary.

- [NIT] 2: Resolved. `src/shared/components/sectioned-form-dialog/SectionedFormDialog.stories.ts:60`
  The default size now belongs to meta args. The template no longer overrides the size arg.
  In the real Controls JSON editor, changing `"md"` to `"lg"` changed the width from 672 to 768 pixels.
  Both themes passed. Width measurements used the final layout after the transition.

### New findings

No new [CRITICAL], [WARN], or [NIT] finding.
The disabled-editor contrast issue remains outside this fix. It does not affect this verdict.

### Checks

- Reviewed all five changed files against the fix brief and the round 1 review.
  The other six story hashes match the round 1 evidence.
  No tracked or staged diff exists. No component source or dependency changed.
  The fix adds no single-character name, raw palette class, `oklch(`, or hex color.
- Matched HEAD `5cbde807f90bd765c54247187f56b689433a3975` and all five full SHA-256 values against the latest fix progress entry.
  Reused its passing results:
  - `vp check src .storybook`: exit 0.
  - `vp test`: exit 0. All 299 tests in 68 files pass.
  - `pnpm build-storybook`: exit 0.
- Ran `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6026`.
  Checked all 25 non-Invalid stories in both themes. All 50 cases started without an error or console error.
  The Invalid stories used real typing, selection, deletion, and the Controls panel.
  The a11y panel reported zero violations for all six Invalid stories in both themes.
- Checked normal Open submission. Clearing Name caused no error before submit.
  An empty submit showed the schema error. Valid typing cleared it, and a valid submit closed the dialog.
  Pending kept submit disabled. Cancel closed Pending.
  ReadOnly kept submit absent. Close closed ReadOnly. Both themes passed these dialog checks.
- Stopped this server. `lsof -nP -iTCP:6026 -sTCP:LISTEN` returned no listener.
  HEAD and all 11 story hashes still matched after browser checks.
  Wrote no unit tests. These changes only affect stories.

Lean: -0 lines possible.

Verdict: approve

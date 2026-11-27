What this change does:
Slice 2 adds 40 stories for 13 UI groups.
The stories compose existing components and show variants, field states, empty states, and overlays.
The config removes the unused MDX glob.

Review round: 1. Date: 2026-11-28.
Repository: `meta-frames-dashboard`.
Review basis: approved plan slice 2 and `brief-storybook-slice2.md`.
Nam approved the plan without an Astra spec.
Expected use: local component development and interactive component examples.

## Findings

### [WARN]

1. **Enabled selection controls do not retain changes.**
   Locations: `src/shared/ui/checkbox/Checkbox.stories.ts:19`, `src/shared/ui/dropdown-menu/DropdownMenu.stories.ts:50`, and `src/shared/ui/dropdown-menu/DropdownMenu.stories.ts:53`.
   The stories supply model values without handling model updates.
   Clicking the Unchecked checkbox leaves `aria-checked="false"`.
   Selecting Dark in the menu closes it. After reopening, Light remains selected and Dark remains unchecked.
   These enabled controls therefore do not behave like their production consumers.
   `ScanSettingsFields.vue:37` and `RollListPage.vue:469` handle the corresponding update events.
   Add local state and model update handlers within the story files.
   Preserve the initial states and the disabled examples.
   Otherwise, users cannot inspect selection behavior through these examples.

2. **Menu groups reference labels that do not exist.**
   Locations: `src/shared/ui/dropdown-menu/DropdownMenu.stories.ts:45` and `src/shared/ui/dropdown-menu/DropdownMenu.stories.ts:53`.
   The Account label sits outside DropdownMenuGroup. The radio group has no label.
   The Accessibility panel reports `aria-valid-attr-value` as inconclusive for both groups in both themes.
   Its details identify missing `aria-labelledby` targets, including `reka-menu-group-v-2` and `reka-menu-group-v-3` in one render.
   Reka's MenuGroup generates a label ID. MenuLabel receives that ID only through its ancestor group.
   Place a DropdownMenuLabel inside each group that requires a name.
   Otherwise, these new examples render group names with unresolved references.
   The same panel also identifies a closed submenu's `aria-controls` target. That separate dependency behavior does not establish this finding.

3. **Avatar has no successful image state.**
   Location: `src/shared/ui/avatar/Avatar.stories.ts:20`.
   Fallback has no image. FailedImage supplies an invalid PNG.
   Both stories therefore show initials. Neither story shows a successfully loaded AvatarImage.
   The production composition at `src/layouts/dashboard/NavUser.vue:43` supports a loaded image and a fallback.
   Add a loaded-image story with a valid, deterministic inline image.
   Keep the fallback and failed-image stories.
   Otherwise, the slice omits the normal image state that the brief requires the stories to represent.

No [CRITICAL] finding applies. The review found no executor change outside the allowed files.

## Known items and existing component issues

- **Pre-existing, outside this slice:** `src/shared/ui/alert/AlertDescription.vue:13` renders the description that fails light-theme contrast.
  The Accessibility panel reports 4.3:1 against a required 4.5:1 for `ui-alert--destructive`.
  The destructive variant at `src/shared/ui/alert/index.ts:16` applies `text-destructive/90` on `bg-card`.
  The story adds no color override. Both component files match HEAD.
  This component defect does not block this slice's approval by itself. Do not fix component source in this slice.
- The automatic titles are `UI/alert-dialog/AlertDialog` and `UI/dropdown-menu/DropdownMenu`.
  They follow the approved path-based title rule. No explicit title is necessary.
- `src/shared/ui/input/Input.stories.ts:31` exports `Number`.
  The name shadows the global only within that module. The module does not call the global Number.
  The story renders its numeric input without an error. No current defect follows from the export name.
- Full `vp check` has the known formatting failure in the slice 1 review file.
  The user excludes this review-file failure from slice 2 findings.
  The reviewer leaves that file unchanged and uses the required scoped check.
- FailedImage has one inconclusive `aria-allowed-role` result in each theme.
  The panel identifies Reka's hidden image with `role="img"` and `alt=""`.
  NavUser uses the same empty-alt pattern. The panel reports no reported violation for this example.

## Composition and scope checks

The review compared the stories with current consumers and the component wrappers.
The following sources supplied the relevant composition patterns.

| Group        | Source checked                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Alert        | `src/features/auth/components/form-alert/FormAlert.vue`                                          |
| AlertDialog  | `src/shared/components/confirm-dialog/ConfirmDialog.vue`                                         |
| Avatar       | `src/layouts/dashboard/NavUser.vue`                                                              |
| Badge        | `src/features/rolls/pages/RollDetailPage.vue`                                                    |
| Breadcrumb   | `src/layouts/dashboard/AppHeader.vue`                                                            |
| Card         | `src/shared/components/data-table/DataTable.vue`                                                 |
| Checkbox     | `src/features/scanners/components/scan-settings-fields/ScanSettingsFields.vue`                   |
| Collapsible  | Group wrappers and their forwarded Reka props. The search found no consumer outside the group.   |
| Dialog       | `src/shared/components/plain-dialog/PlainDialog.vue`                                             |
| DropdownMenu | `src/shared/components/data-table/DataTable.vue` and `src/features/rolls/pages/RollListPage.vue` |
| Empty        | `src/shared/components/not-found/NotFound.vue`                                                   |
| Input        | `src/shared/components/form-input/FormInput.vue`                                                 |
| Label        | `src/shared/components/form-field/FormField.vue`                                                 |

- The 13 files use Meta and StoryObj from `@storybook/vue3-vite`.
- Each meta uses `satisfies Meta<Props>` or an equivalent inline or exported props type.
- No meta uses `Meta<typeof Component>`.
- Alert options match `default` and `destructive`. Badge options match its four cva variants.
- EmptyMedia options match `default` and `icon`. Other roots expose no additional cva variant prop for these stories.
- The stories include checkbox states, invalid fields, disabled controls, open and closed collapsibles, and overlay triggers.
- Open overlay stories use `defaultOpen` and `tags: ['!autodocs']`.
- The reviewer found no single-character names, raw palette classes, `oklch(` values, or hex colors in the stories.
- The stories contain no play functions, assertions, or shared fixtures.
- The main.ts change removes only the MDX entry from the approved slice 1 configuration.
- The index contains no staged changes. The review includes all unstaged changes and untracked source files.
- The previously approved slice 1 files remain outside slice 2 findings.
- The supplied workflow documents are review inputs or output. Their content is outside the change review.
- No component source changed. The reviewer added no unit tests and started no later slice.

## Verification

HEAD is `57841df19ebfa441dbc39fbd1a2fafc0960ed6be`.
The latest progress entry records only hash prefixes, rather than complete SHA-256 values.
The reviewer therefore reran the required commands and captured complete hashes for the current tree.
The reviewer reused no earlier passing result.

| Command                                                      | Result                                                                | Checked content                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------- |
| `vp check src .storybook`                                    | Exit 0. All 446 files formatted. No lint or type errors in 444 files. | Current source and Storybook config |
| `vp test`                                                    | Exit 0. 68 files and 299 tests passed.                                | Current working tree                |
| `pnpm build-storybook`                                       | Exit 0. Index contains all 40 new stories.                            | Current working tree                |
| `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6013` | Server started after sandbox escalation.                              | Same source tree                    |

The reviewer opened every new story in light mode and dark mode through Storybook's manager.
The reviewer read the Accessibility panel for all 80 combinations.

- All 80 combinations rendered with the expected theme class. The browser captured no console errors.
- Light Destructive Alert had one reported contrast violation. All other combinations had zero reported violations.
- FailedImage and Open DropdownMenu each had one inconclusive rule in both themes, as described above.
- Open alert dialog and dialog stories each had zero reported accessibility violations in both themes.
- Navigation from each open overlay to Default removed its overlay, body scroll lock, and body pointer restriction.
- These navigation checks used sidebar links within the existing page, without reloading the manager.
- AlertDialog, Dialog, and DropdownMenu autodocs showed without an open overlay or a body lock.
- The reviewer also checked checkbox clicks and menu radio selection. Finding 1 records the observed failures.
- The reviewer stopped the server after the browser checks.

The stories contain no business logic. No unit tests are necessary for this slice.
No staged format pass applies because the index contains no staged changes.

## Content evidence

The following SHA-256 values identify the checked source at the base above.
Git status lists all 13 story files and main.ts as untracked. The index contains no in-scope changes.

| Path                                                  | SHA-256                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `.storybook/main.ts`                                  | `b9b93431d2450104dab7aac73ab9caeffbd405fc1c1b4141aa4343ac1d353927` |
| `src/shared/ui/alert/Alert.stories.ts`                | `3c0f1a9951f68dfb070d7a16bcfa4032ebb9ab754f2374fd60fc7661bb4ef156` |
| `src/shared/ui/alert-dialog/AlertDialog.stories.ts`   | `ae145991af757d64d3027c3ee5e183398cae3c544aceb99720c6cf3708fa955e` |
| `src/shared/ui/avatar/Avatar.stories.ts`              | `f642797b9e03b945e61290e4762bce800a901937ec89502e98c8af3148fd364c` |
| `src/shared/ui/badge/Badge.stories.ts`                | `f80c0e19d00204a6bd7b5f093fe465c50971540648c965d86bac7fa9ade2c048` |
| `src/shared/ui/breadcrumb/Breadcrumb.stories.ts`      | `b566cb10a7b59479fff2569fd2b4577a1d15da25e2208659e272ddbd66ee3688` |
| `src/shared/ui/card/Card.stories.ts`                  | `bd31ecd1830c6655184c125a89fc2259e29faf1dc3094222ce05f68829369cb3` |
| `src/shared/ui/checkbox/Checkbox.stories.ts`          | `c8845ca41b49f1cf085e2a9cdd92ec414b6d537d0cc5902f918babe93b3fca04` |
| `src/shared/ui/collapsible/Collapsible.stories.ts`    | `6585438e36ff753621c8295832e7a991daeb8285a86de186137eab089e309f21` |
| `src/shared/ui/dialog/Dialog.stories.ts`              | `eeedac2c45b06a187c3835563c44cdf6f2b3aca4b4c9231f0fe4a1d4f0f37abb` |
| `src/shared/ui/dropdown-menu/DropdownMenu.stories.ts` | `03afbd83be89abff2467159fe6642dc6680dedbf96148462ecdfc51b48a1f668` |
| `src/shared/ui/empty/Empty.stories.ts`                | `f9788367bc83ea7dc017a95c8a21dce6f1cd3c955beb1671741f9f30bdffc487` |
| `src/shared/ui/input/Input.stories.ts`                | `c99adc0c54821c40fdc5def28e4a1f7313eacbc93b4fdc86badcfea8ee1217f6` |
| `src/shared/ui/label/Label.stories.ts`                | `bdf39ac5076a7763d608b216bd405b8d48362dca0e5ff5ca9e22f9f91919f9ff` |

Lean: -0 lines possible.

Verdict: request changes

## Round 2

The fix adds local selection state, associates the menu labels, and adds a loaded-avatar example.
Review basis: `brief-storybook-slice2-fix1.md`. This is review round 2 of 2.
The round 1 text above remains the historical review.

### Status of round 1 findings

| Finding                         | Status   | Evidence                                                                                                                  |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| [WARN] 1, selection persistence | Resolved | Checkbox clicks persist. Menu checkbox and radio selections persist after reopening in both themes.                       |
| [WARN] 2, missing menu labels   | Resolved | Both groups resolve their labels to Account and Theme. Neither theme reports an unresolved group label in the a11y panel. |
| [WARN] 3, loaded avatar         | Resolved | Loaded renders a visible image in both themes. Fallback and FailedImage remain available.                                 |

The initial checkbox states remain false, true, and mixed in their respective stories.
Disabled and DisabledChecked retain their disabled state and their original values in both themes.
The menu initially selects Show archived and Light. Billing remains disabled.
After changing Show archived, reopening the menu preserves its false value.
After selecting Dark, reopening preserves Dark checked and Light unchecked.
These checks passed for Default and Open in both themes.

The a11y panel reports zero violations for the changed stories.
Open DropdownMenu retains one inconclusive rule for a closed submenu's `aria-controls` target.
Its details no longer contain either group's `aria-labelledby` target.
FailedImage retains the existing inconclusive rule about its hidden image role.

Loaded renders a 36 by 36 image with `naturalWidth: 150` and no visible initials.
Its panel reports zero violations, nine passes, and zero inconclusive results in each theme.
The SVG's currentColor resolves independently of the page color.
The dark screenshot still shows the black circle against the navy background.
The reviewer found no invisible image or a11y failure and reports no finding about this color choice.

### New findings

#### [WARN]

4. **The checkbox no longer follows its modelValue control.** `src/shared/ui/checkbox/Checkbox.stories.ts:18`.
   Setup copies `args.modelValue` into a ref once.
   Line 20 then overrides the reactive arg with that local ref.
   Later changes to `args.modelValue` do not update the ref.
   Reproduction: open Unchecked, select the Controls tab, and click the visible True option for modelValue.
   The Controls switch becomes checked, but the canvas checkbox keeps `aria-checked="false"`.
   The reviewer checked both values after the update. This is separate from the resolved click-persistence defect.
   Synchronize the local ref when modelValue args change. Preserve the handler that retains checkbox clicks.
   Otherwise, the Controls panel and the component show different states.

No new [CRITICAL] or [NIT] finding applies.
The review found no component source change or executor change outside the three allowed story files.
The three stories contain no single-character names, raw palette classes, `oklch(` values, or hex colors.
The other 11 story/config hashes match the round 1 snapshot.
The previously approved slice 1 files and the other slice 2 files remain outside this fix review.

### Round 2 verification

HEAD remains `57841df19ebfa441dbc39fbd1a2fafc0960ed6be`.
The fix progress entry again records abbreviated hashes.
The reviewer therefore reran the required checks instead of reusing those results.
The three changed files remain untracked. The index contains no staged changes.

| Command                                                      | Result                                                                | Checked content           |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------- |
| `vp check src .storybook`                                    | Exit 0. All 446 files formatted. No lint or type errors in 444 files. | Current source and config |
| `vp test`                                                    | Exit 0. 68 files and 299 tests passed.                                | Current working tree      |
| `pnpm build-storybook`                                       | Exit 0. Storybook build completed successfully.                       | Current working tree      |
| `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6014` | Server started after sandbox escalation.                              | Same source tree          |
| `git diff --check`                                           | Exit 0                                                                | Tracked working changes   |

The browser check covered all six Checkbox stories, both DropdownMenu stories, and all three Avatar stories in both themes.
The reviewer read the a11y panel and checked the affected interactions.
The browser captured no console errors during these checks.
The reviewer reset the temporary viewport override and stopped the server.
A final port check found no listener on port 6014.
HEAD and all 14 captured story/config hashes still matched after verification.
The reviewer added no unit tests and changed no production code.
Slice 3 did not start.

### Round 2 content evidence

| Path                                                  | SHA-256                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `src/shared/ui/checkbox/Checkbox.stories.ts`          | `7c69f2589e11aa24e67d8f12d6f2ec674272c6d2706db5b07c58460a360e08f4` |
| `src/shared/ui/dropdown-menu/DropdownMenu.stories.ts` | `560ab87af9fb9949b9816c2d2fa8a0b610dcceeb19afeffd47e9b28f35aecad1` |
| `src/shared/ui/avatar/Avatar.stories.ts`              | `f1a359d81f8346249cec27c92bd06037c4025607e988ca63d47fb68904afb717` |

Two review rounds are complete. The fix introduced finding 4.
Under the workspace escalation rule, Opus must address this defect before Sol reviews that fix once.
Do not start another Sonnet review cycle.

Lean: -0 lines possible.

Verdict: request changes

## Round 3 (Opus fix)

The Opus fix watches `args.modelValue` and updates the local checkbox ref when the Controls panel changes that arg.
The existing click handler remains unchanged.
This is the single review of the escalation fix for round 2 finding 4.

### Finding status

The Opus fix resolves round 2 [WARN] 4 at `src/shared/ui/checkbox/Checkbox.stories.ts:21`.
In the Unchecked story, the reviewer selected True and then False through the visible Controls panel.
The canvas followed both changes. A subsequent checkbox click set its checked state to true.
These interactions passed in light mode and dark mode.
The check used the Controls UI, not the Storybook channel.

No new [CRITICAL], [WARN], or [NIT] finding applies.
The earlier round 1 findings remain resolved.

### Regression and scope checks

The reviewer opened all six Checkbox stories in both themes.

| Story           | Initial checked state | Other state           |
| --------------- | --------------------- | --------------------- |
| Unchecked       | `false`               | Enabled               |
| Checked         | `true`                | Enabled               |
| Indeterminate   | `mixed`               | Enabled               |
| Disabled        | `false`               | Disabled              |
| DisabledChecked | `true`                | Disabled              |
| Invalid         | `false`               | `aria-invalid="true"` |

All 12 initial-state checks passed. The browser captured no console errors.
The file contains no single-character names, raw palette classes, `oklch(` values, or hex colors.
Comparison with the round 2 snapshot identifies only Checkbox.stories.ts as changed among the 14 story/config files.
The index contains no staged changes. No component source changed.
The review found no executor change outside the allowed story and workspace progress log.
The reviewer added no unit tests and started no later slice.

### Verification and evidence

HEAD matches the progress entry: `57841df19ebfa441dbc39fbd1a2fafc0960ed6be`.
Checkbox.stories.ts matches its full recorded SHA-256:
`b6a4f8d94414b58edf10360acb90db3b6f829c8b98cbec9f4b97dd1d35f993be`.
The reviewer reused the following results from the Opus escalation progress entry.

| Command                   | Recorded result                                                       |
| ------------------------- | --------------------------------------------------------------------- |
| `vp check src .storybook` | Exit 0. All 446 files formatted. No lint or type errors in 444 files. |
| `vp test`                 | Exit 0. 68 files and 299 tests passed.                                |
| `pnpm build-storybook`    | Exit 0                                                                |

For browser verification, the reviewer started a separate server with the current configuration:
`pnpm storybook --ci --no-open --host 127.0.0.1 --port 6015`.
The server started after sandbox escalation. The reviewer did not use the old server on port 6006.
After verification, HEAD and the story hash still matched the recorded evidence.
The reviewer stopped the server. A final port check found no listener on port 6015.
The earlier review text remains above this section.

Lean: -0 lines possible.

Verdict: approve

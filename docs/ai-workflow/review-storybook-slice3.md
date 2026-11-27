What this change does:
Slice 3 adds 38 stories for 12 UI groups.
The stories compose existing components and add local state with Controls synchronization for interactive examples.
They include sidebar layouts, sheet overlays, toast buttons, and tooltips.

Review round: 1. Date: 2026-11-28.
Repository: `meta-frames-dashboard`.
Review basis: approved plan slice 3 and `brief-storybook-slice3.md`.
Nam approved the plan without an Astra spec.
Expected use: local component development, canvas interaction, and autodocs.

## Findings

### [WARN]

1. **Sonner autodocs creates three toasters for one notification.**
   Locations: `src/shared/ui/sonner/Sonner.stories.ts:23` and `src/shared/ui/sonner/Sonner.stories.ts:33`.
   Autodocs mounts the primary example and both exported stories in the same document.
   Each example mounts a Toaster, and all three receive the same global toast event.
   Reproduction: open Sonner Docs and click the primary example's Success button once.
   The document contains three `data-sonner-toaster` elements and three copies of the notification.
   Exclude these examples from the shared autodocs page, as the overlay stories already do.
   Keep one toaster per canvas example. No component change is necessary.
   Otherwise, one click produces duplicate notifications in the generated documentation.

2. **Select omits its supported invalid state.**
   Location: `src/shared/ui/select/Select.stories.ts:71`.
   The exports cover placeholder, selected, disabled, and open states, but no invalid state.
   The brief explicitly requires invalid examples through `aria-invalid` where supported.
   `src/shared/ui/select/SelectTrigger.vue:29` applies `inputFocusVariants()`.
   That helper defines invalid styling at `src/shared/ui/input/index.ts:14`.
   SelectTrigger also forwards attributes to its Reka trigger.
   The absence of an `invalid` prop on the root does not remove this supported trigger state.
   Add an Invalid story that sets `aria-invalid="true"` on SelectTrigger.
   Do not add a component prop or bind the attribute only to SelectRoot.
   Otherwise, the stories omit the invalid state of this input control.

No [CRITICAL] or [NIT] finding applies.
The review found no executor change outside the allowed files.

## Known component issues and proposed additions

These existing component issues do not require source changes within this slice.

- **Pre-existing contrast defect:** `src/shared/ui/sidebar/SidebarGroupLabel.vue:23` applies `text-sidebar-foreground/70`.
  The a11y panel reports 3.59:1 against a required 4.5:1 for the Library label in light mode.
  Expanded, Floating, and Offcanvas each report this violation. Their dark versions report zero violations.
  Collapsed hides the label and reports no contrast violation.
  The story supplies no text-color override. The component matches HEAD.
  A separate component task can address the default label contrast.
- **Pre-existing Select component/dependency behavior:** `src/shared/ui/select/SelectContent.vue:30` uses Reka's modal SelectContent.
  Open reports `aria-hidden-focus` on `#storybook-root` in both themes.
  The reviewer also opened Placeholder through a real trigger click and reran the a11y panel.
  That interaction produces the same violation.
  The modal marks the root `aria-hidden="true"` while it contains the focusable trigger.
  The story neither adds that attribute nor adds a hidden focusable wrapper.
  This evidence identifies component/dependency behavior, rather than misuse of defaultOpen in the story.
  A separate component task can investigate this behavior.

## Composition and source checks

The review compared the stories with existing consumers and their component wrappers.

| Group      | Source checked                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Pagination | `src/shared/components/data-table/DataTable.vue`                                               |
| Select     | `src/shared/components/select/Select.vue` and `src/shared/components/data-table/DataTable.vue` |
| Separator  | `src/layouts/dashboard/AppHeader.vue`                                                          |
| Sheet      | `src/features/audit/components/audit-log-sheet/AuditLogSheet.vue`                              |
| Sidebar    | `src/layouts/dashboard/AppSidebar.vue` and `src/layouts/dashboard/DashboardLayout.vue`         |
| Skeleton   | `src/shared/components/query-boundary/QueryBoundary.vue` and `src/app/RoutePending.vue`        |
| Sonner     | `src/layouts/root/RootLayout.vue` and `src/app/providers.ts`                                   |
| Switch     | `src/features/rolls/components/in-stock-toolbar/InStockToolbar.vue`                            |
| Table      | `src/shared/components/data-table/DataTable.vue`                                               |
| Tabs       | `src/features/rolls/pages/RollListPage.vue`                                                    |
| Textarea   | `src/shared/components/form-input/FormInput.vue`                                               |
| Tooltip    | `src/layouts/dashboard/AlertsButton.vue` and `src/shared/ui/tooltip/Tooltip.vue`               |

- Sidebar uses SidebarProvider, the existing sidebar parts, SidebarInset, and fullscreen layout.
- Expanded, Collapsed, Floating, and Offcanvas cover the declared layout examples.
- Sidebar root values match SidebarProps. The nested menu buttons use their default cva variant.
- No unsupported cva option appears in these stories.
- Sheet open examples use defaultOpen and exclude autodocs.
- Tooltip adds one TooltipProvider. The Tooltip wrapper itself contains only TooltipRoot and requires that provider.
- Select labels sit inside their groups.
- Controls with model args use local refs, update handlers, and watches that copy changed args.
- Each meta uses a props type through `satisfies Meta<Props>`.
- No meta uses `Meta<typeof Component>`.
- The stories contain no single-character names, raw palette classes, `oklch(` values, or hex colors.
- No story contains a play function, assertion, or shared fixture.
- The table uses a local inline array and includes TableEmpty.
- Skeleton includes line and composed loading examples.

The image-source lesson from slice 2 does not apply because this slice adds no image story.
The other three lessons apply to the model state, Controls synchronization, and Select group labels.

## Browser verification

The reviewer started `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6016`.
The server started after sandbox escalation. Port 6006 remained untouched.
The reviewer opened all 38 new stories in light mode and dark mode.
The theme class matched every selection. The browser captured no console errors across all 76 combinations.
The reviewer read Storybook's Accessibility panel for every combination.

| Group      | Stories | Panel result                                         |
| ---------- | ------- | ---------------------------------------------------- |
| Pagination | 5       | Zero violations in both themes                       |
| Select     | 4       | Open has the existing modal violation in both themes |
| Separator  | 2       | Zero violations in both themes                       |
| Sheet      | 3       | Zero violations in both themes                       |
| Sidebar    | 4       | Existing label contrast in three light stories only  |
| Skeleton   | 2       | Zero violations in both themes                       |
| Sonner     | 2       | Zero canvas violations in both themes                |
| Switch     | 5       | Zero violations in both themes                       |
| Table      | 2       | Zero violations in both themes                       |
| Tabs       | 2       | Zero violations in both themes                       |
| Textarea   | 4       | Zero violations in both themes                       |
| Tooltip    | 3       | Zero violations in both themes                       |

Select Open, Sheet Open, and Sidebar Collapsed also have inconclusive panel results.
These results are not passing assertions. The known issues section records the two component violations.

### Real interactions

The reviewer used actual browser clicks and key presses, without dispatching synthetic DOM events.
The following checks passed in light mode and dark mode.

- Pagination Next selects page 2. Changing the page control to 6 selects page 6.
- Select retains a clicked 35mm option. Changing modelValue through Controls selects 4x5.
- Tabs retains a clicked Frames tab. ArrowLeft selects Details. Controls can select Frames again.
- Switch retains a click. Space changes it back. The visible True control changes the canvas switch.
- Textarea retains typed text. A valid JSON string in its modelValue editor changes the canvas text.
- Sidebar's trigger collapses the sidebar. False and True in Controls select collapsed and expanded states.

The Controls editors for union-typed values expect JSON. The reviewer used quoted JSON strings where the editor requested them.

### Overlay and notification cleanup

- Navigation from Sheet Open and OpenLeft to Default removes the dialog, body scroll lock, and pointer restriction.
- These checks use sidebar navigation within the current manager page, without reloading it.
- After navigation, the trigger can open a new sheet, and Close dismisses it.
  This also checks that a stale focus trap does not block the next interaction.
- A real keyboard focus on the default tooltip's trigger displays Add to stock.
- Sonner canvas contains one toaster. Default, Success, and Error each create the corresponding toast type.
- Navigating from Default to Rich Colors removes the previous visible toasts.
  The destination contains one toaster and zero old toasts.
- Sonner autodocs fails the singleton check, as finding 1 records.

The reviewer stopped the server. A final port check found no listener on port 6016.

## Checks and content evidence

HEAD matches the progress entry: `44472a05b960f136b2858dc4db072cbce51ca51e`.
All 12 complete SHA-256 values match the current story files.
The reviewer reused the following recorded results.

| Command                   | Recorded result                                           |
| ------------------------- | --------------------------------------------------------- |
| `vp check src .storybook` | Exit 0. 456 files, no warning, lint error, or type error. |
| `vp test`                 | Exit 0. 68 files and 299 tests passed.                    |
| `pnpm build-storybook`    | Exit 0. Index lists all 38 new stories.                   |

Git lists all 12 story files as untracked. Git reports no tracked working changes and no staged changes.
The other untracked paths are the supplied workflow briefs, which are outside this change review.
HEAD and all 12 source hashes still matched after browser verification.
Slices 1 and 2 remain unchanged. No component source changed.
The reviewer added no unit tests and started no later slice.

| Path                                             | SHA-256                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `src/shared/ui/pagination/Pagination.stories.ts` | `734d8e93d66914b6857a7095119a25f679465387e570ec671a04834a090c92af` |
| `src/shared/ui/select/Select.stories.ts`         | `a2ae095b6ea67d978d89a864a6a0bf7eb6d5fb958d928c4424339e171dcf3535` |
| `src/shared/ui/separator/Separator.stories.ts`   | `5178af1c1c05242dcd8b0a4661caf89c84704f5bd7d3a1fd3c520506bff5ad05` |
| `src/shared/ui/sheet/Sheet.stories.ts`           | `7e30bd871425df390e5fac42b73eefff6c919c4c3f7d36ad701cdc18283fdcce` |
| `src/shared/ui/sidebar/Sidebar.stories.ts`       | `9f8deae901b3d6d703c2fe242a89c3af1ab0e7d3bab9a54b5522c14e0bed2a07` |
| `src/shared/ui/skeleton/Skeleton.stories.ts`     | `b0d719fcf616c5b928b29c86056bbae71a9c7097f22b9ffe588d3bc6e2554e8d` |
| `src/shared/ui/sonner/Sonner.stories.ts`         | `98ef113199353e19ac1197a5458c70fa467eb3a51c520ca1bb98330ed2a0e259` |
| `src/shared/ui/switch/Switch.stories.ts`         | `2bbf3b1fe34f7e52e7620035bef6507ee1e76a36b85c8c65f2a54c15a6525cf5` |
| `src/shared/ui/table/Table.stories.ts`           | `f4995fe61ebffd1968341f075861ae1b31712ce926de9b6fc8b04d796a252287` |
| `src/shared/ui/tabs/Tabs.stories.ts`             | `56e01f58a0ea042eea318528c9c88814d419c2bdae4d657f0afdcf32d494c289` |
| `src/shared/ui/textarea/Textarea.stories.ts`     | `cc08adf2de8edc23b638d8c4c23c92c7197f27a210e11ac93eb0e317df90ea77` |
| `src/shared/ui/tooltip/Tooltip.stories.ts`       | `c84d172d397d26a626acb37e9c7ebe5fd4b2c43909f9889536193d70cf34ecdf` |

Lean: -0 lines possible.

Verdict: request changes

## Round 2

The fix excludes Sonner from autodocs and adds the Select Invalid example through a shared render helper.
Review basis: `brief-storybook-slice3-fix1.md`. This is review round 2 of 2.
The round 1 text above remains the historical review.

### Status of round 1 findings

| Finding                         | Status   | Evidence                                                                                                                      |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [WARN] 1, duplicate toasters    | Resolved | Sonner has no docs entry. Each canvas mounts one toaster and creates one toast per click.                                     |
| [WARN] 2, missing invalid state | Resolved | Invalid renders the attribute and invalid border on SelectTrigger in both themes. Finding 3 records a remaining Controls gap. |

### New findings

#### [WARN]

3. **Invalid exposes no modelValue control.** `src/shared/ui/select/Select.stories.ts:77`.
   Invalid defines only its render function. The meta supplies no modelValue arg or explicit control.
   The actual Controls panel contains only the default slot and its Set object button.
   No modelValue control exists in either theme, so the required Controls interaction cannot run for Invalid.
   Add a modelValue arg or an explicit text control for this story.
   The existing watcher can then synchronize that control with the canvas.
   Otherwise, users can change the example through its dropdown but cannot change its value through Controls.
   Selected exposes its modelValue control and passes that interaction, so the renderer's shared watcher still works.

No new [CRITICAL] or [NIT] finding applies.

### Render helper assessment

`renderSelect(triggerAttrs)` has two private call sites: an empty string and the fixed `aria-invalid="true"` string.
Both produce valid templates. The invalid attribute reaches SelectTrigger, and the other Select triggers retain no invalid attribute.
The helper interpolates no runtime arg or external input into template syntax.
A bound boolean would express this one attribute more directly, but the current constant strings cause no correctness finding.
The helper preserves the local ref, model update handler, and Controls watcher.

### Browser checks

The reviewer checked the following results in light mode and dark mode.

- Sonner Default and RichColors each mount one `data-sonner-toaster`.
- Clicking Default, Success, and Error increases the toast count from zero to one, two, and three.
- Each added toast has the corresponding default, success, or error type.
- These checks cover all 12 button combinations across the two stories and two themes.
- The generated index has no `ui-sonner--docs` entry. The live Sonner navigation contains only the two canvas stories.
- Invalid sets `aria-invalid="true"` on the trigger.
- Its border is `rgb(220, 38, 38)` in light mode and `rgb(248, 113, 113)` in dark mode.
- A real trigger click opens the list. A real click on 120 selects and retains that item.
- Placeholder keeps its placeholder. Selected initially displays 120. Disabled keeps its disabled trigger and 35mm value.
- Open displays the list, and selecting 35mm closes it and retains the selection.
- The Selected story follows a real Controls edit from 120 to 4x5 in both themes.
- Select Docs renders the primary example, Placeholder, Selected, Disabled, and Invalid in both themes.
- The Invalid docs example has the invalid attribute. The other docs triggers do not.
- The browser captured no console errors during these checks.

The round 1 Sidebar contrast and Select modal findings remain outside the fix scope.

### Scope and verification environment

At the start, HEAD and both complete hashes matched the supplied progress entry.
The shared checkout then moved to `b31e1d22b70c38f1510f9459769e56a6ef387a55` and removed `.storybook`.
That change terminated the initial review server on port 6017.
The reviewer did not change the checkout or restore its configuration.

The reviewer created a temporary snapshot from `44472a05b960f136b2858dc4db072cbce51ca51e` and copied the 12 reviewed story files.
All 12 source hashes matched the original review inputs.
The snapshot reused installed dependencies after matching package.json, pnpm-lock.yaml, and pnpm-workspace.yaml.
Browser verification and the repeated checks used this frozen snapshot.
The snapshot path is `/tmp/storybook-slice3-fix-review-raqbx3xo`.
These results apply to that requested base and those story hashes, rather than the moving checkout.

The reviewer ran `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6018` in the snapshot.
The server started after sandbox escalation. Port 6006 remained untouched.
The reviewer stopped the snapshot server after verification. A final port check found no listener on port 6018.

Only Sonner.stories.ts and Select.stories.ts differ from the round 1 source snapshot.
The other ten story files retain their hashes.
The two changed files contain no single-character names, raw palette classes, `oklch(` values, or hex colors.
No component source changed. The reviewer added no unit tests and started no later slice.

### Round 2 check results

The reviewer reran these commands in the frozen snapshot after the shared checkout changed.

| Command                   | Result                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| `vp check src .storybook` | Exit 0. All 458 files formatted. No lint or type errors in 456 files. |
| `vp test`                 | Final rerun: exit 0. 68 files and 299 tests passed.                   |
| `pnpm build-storybook`    | Exit 0. The index includes Invalid and excludes Sonner Docs.          |

The initial full test run failed three route tests and passed 296 tests.
Each failure reported a missing mounted detail component within `<div></div>`.
The unchanged base passed all six focused route tests and its full 299-test suite.
The fix snapshot also passed the focused route tests and then its full 299-test suite.
No source changed between these runs. The reviewer did not establish the cause of the initial failures.
The passing rerun does not explain that initial failure.

### Round 2 content evidence

Snapshot base: `44472a05b960f136b2858dc4db072cbce51ca51e`.
The following complete hashes matched the progress entry and remained unchanged during verification.

| Path                                     | SHA-256                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `src/shared/ui/sonner/Sonner.stories.ts` | `93c5ac3c159506fc1db3700a00e191c7ae281bef37996a1ac85393bf50eeb3c6` |
| `src/shared/ui/select/Select.stories.ts` | `a8025eefc60c0f806a38b013a50356ac8113f3bb73b30ae6e0bee72a0b14b74b` |

Two review rounds are complete. Route finding 3 to Opus under the workspace escalation rule.
Do not start another Sonnet review cycle.

Lean: -0 lines possible.

Verdict: request changes

## Round 3 (Opus fix)

The Opus fix adds an explicit modelValue control to the Select meta.
The control offers the three enabled item values: 35mm, 120, and 4x5.
The renderer, local state, and watcher remain unchanged.
This is the single review of the escalation fix for round 2 finding 3.

### Finding status

The fix resolves round 2 [WARN] 3 at `src/shared/ui/select/Select.stories.ts:68`.
Invalid now exposes a modelValue dropdown in the actual Controls panel.
Selecting 120 and then 4x5 updates the canvas to each value in both themes.
A subsequent real dropdown interaction selects and retains 35mm.
The trigger keeps `aria-invalid="true"` throughout these interactions.
Its border remains `rgb(220, 38, 38)` in light mode and `rgb(248, 113, 113)` in dark mode.

No new [CRITICAL], [WARN], or [NIT] finding applies.
The earlier round 1 findings remain resolved.

### Regression checks

The reviewer checked all five Select stories and Select Docs in light mode and dark mode.

| Example     | Result                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Placeholder | Keeps its placeholder and enabled trigger                                                      |
| Selected    | Initially displays 120. Controls selects 4x5. A real click selects 35mm.                       |
| Disabled    | Keeps its disabled trigger and 35mm value                                                      |
| Open        | Opens initially. A real click selects and retains 120.                                         |
| Invalid     | Follows Controls and real clicks while retaining the invalid attribute and border              |
| Select Docs | Renders the primary example and four included stories. Only Invalid has the invalid attribute. |

The browser captured no console errors during these checks.
The modelValue control options match the enabled SelectItem values.
The disabled 8x10 item remains in the component list.
The file contains no single-character names, raw palette classes, `oklch(` values, or hex colors.
Only Select.stories.ts differs from the round 2 source snapshot.
No component source changed, and the index contains no staged changes.
The review found no executor change outside the allowed story and workspace progress log.
The reviewer added no unit tests and started no later slice.

### Verification and content evidence

HEAD matches the progress entry: `44472a05b960f136b2858dc4db072cbce51ca51e`.
Select.stories.ts matches its full recorded SHA-256:
`eada109275525ea993b3ac00722cfef311ea4b0209173ad7a7308069ed3ddb76`.
HEAD and the story hash still matched after browser verification.
The reviewer reused these passing results from the Opus escalation progress entry.

| Command                   | Recorded result                                                       |
| ------------------------- | --------------------------------------------------------------------- |
| `vp check src .storybook` | Exit 0. All 458 files formatted. No lint or type errors in 456 files. |
| `vp test`                 | Exit 0. 68 files and 299 tests passed.                                |
| `pnpm build-storybook`    | Exit 0                                                                |

For browser verification, the reviewer ran:
`pnpm storybook --ci --no-open --host 127.0.0.1 --port 6019`.
The server started after sandbox escalation. The reviewer did not use port 6006.
The reviewer stopped the server. A final port check found no listener on port 6019.
The earlier review text remains above this section.

Lean: -0 lines possible.

Verdict: approve

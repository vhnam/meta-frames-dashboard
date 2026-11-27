What this change does:
Slice 1 configures Storybook with app styles, query support, theme selection, and a router that uses memory history.
It adds eight Button stories, autodocs, and the a11y addon.
It removes the generated examples and ignores Storybook output.

Review round: 1. Date: 2026-11-28.
Repository: `meta-frames-dashboard`.
Review basis: approved `plan-storybook.md`, Decisions 3–5, slice 1, and `brief-storybook-slice1.md`.
Nam approved the plan without an Astra spec.
This review replaces the earlier review of the init state.
Expected use: local component development.

## Findings

### [NIT]

1. **Remove the unused MDX glob.** `.storybook/main.ts:5`.
   The config still searches `../src/**/*.mdx` after the slice removes the only MDX file.
   Storybook reports `No story files found for the specified pattern: src/**/*.mdx` on startup.
   Remove this entry. The approved scope excludes separate MDX pages, and autodocs does not need this glob.
   If the entry remains, startup continues with an unnecessary warning. This finding does not block approval.

No [CRITICAL] or [WARN] finding remains.

## Scope and source review

- The index contains no staged changes. The review includes unstaged changes and untracked source files.
- The executor changes only the allowed files. No component source differs from HEAD.
- The review excludes Nam's scripts, four existing Storybook dependencies, esbuild setting, and related lockfile changes from findings.
- The supplied `docs/ai-workflow/*storybook*` files are review inputs or output. Their content is outside the change review.
- `src/stories/` and `debug-storybook.log` are absent.
- `.gitignore` contains `storybook-static/` and `debug-storybook.log`.
- `main.ts` defines `UI`, `Components`, and `Features` prefixes for the required directories.
- Its addons are only addon-vitest, addon-a11y, and addon-docs. Chromatic is absent.
- The manifest and lockfile pin `@storybook/addon-a11y` to `10.6.9`.
- `pnpm list @storybook/addon-a11y --depth 0` reports installed version `10.6.9`.
- `preview.ts` imports `#/styles/index.css` and `vue-sonner/style.css`.
- It installs VueQueryPlugin with a new QueryClient. Queries use `retry: false` and `staleTime: Infinity`.
- It imports neither the app queryClient nor `#/shared/lib/theme`.
- `withTheme` changes only the root `.dark` class and `colorScheme`. It writes no localStorage value.
- `withRouter` creates one router during each mounted wrapper's setup. It uses memory history and one `/$` catch-all route.
- The route renders the story beneath RouterProvider. The theme wrapper also reaches the story.
- The decorator order works in both canvas and autodocs. Live theme changes reach the routed Button.
- Button controls match all six cva variants and all eight cva sizes in `src/shared/ui/button/index.ts`.
- The story imports Meta and StoryObj from `@storybook/vue3-vite`.
- It uses `satisfies Meta<ButtonVariants & { disabled?: boolean }>` as the updated plan requires.
- The story contains no single-character names, raw palette class, `oklch(` value, or hex color.

## Router lifetime and args

The router constructor runs inside Vue setup, not inside the wrapper's render function.
Storybook 10.6.9 updates reactive args on an existing canvas app when `forceRemount` is false.
Its renderer retains the mounted root during these updates.
The installed renderer implements this behavior in `@storybook/vue3/dist/_browser-chunks/chunk-X42PMG4S.js:168`.

TanStack's `src/Transitioner.tsx:22` registers the history unsubscribe callback with Vue's unmount hook.
Memory history adds no browser navigation listener.
The review found no args-driven router leak or unexpected router remount.
This conclusion uses the installed framework source and the live control check.
It does not claim a heap measurement.

The live check changed Outline's variant control to `secondary`.
The rendered Button updated its `data-variant` to `secondary` without a console error.
The reviewer reset the controls before the final story checks.

The executor's temporary Link check reports an anchor with `href="/app/rolls"`.
The decorator hash matches that check's recorded content.
The reviewer reused this Link evidence and added no temporary story.
The Button story named Link tests the Button variant. It does not test TanStack Link.

## Verification

HEAD matches the recorded base: `57841df19ebfa441dbc39fbd1a2fafc0960ed6be`.
All seven recorded hashes match the current in-scope files.
The removed paths remain absent. The index contains no staged changes.
The reviewer reused the following passing results from the latest workspace progress entry.

| Command                      | Recorded result                                       | Evidence decision                 |
| ---------------------------- | ----------------------------------------------------- | --------------------------------- |
| `vp check`                   | Exit 0, 463 files, no lint or type error              | Reused after base and hash checks |
| `vp test`                    | Exit 0, 68 files, 299 tests                           | Reused after base and hash checks |
| `pnpm build-storybook`       | Exit 0, nine Button entries, no missing-addon warning | Reused after base and hash checks |
| `pnpm exec vue-tsc --noEmit` | Exit 0                                                | Reused after base and hash checks |

The reviewer ran `pnpm storybook --ci --no-open --host 127.0.0.1 --port 6012`.
The server started after sandbox escalation.
The reviewer opened the live server in the in-app browser.

- All eight Button stories rendered in light mode and dark mode.
- The Disabled story rendered a disabled button in both modes.
- The default Button used `Geist Mono Variable`.
- Its background was `rgb(51, 65, 85)` in light mode and `rgb(226, 232, 240)` in dark mode.
- The toolbar set `.dark` and `colorScheme: dark` on the preview document root.
- Selecting Light removed `.dark` and set `colorScheme: light`.
- Selecting the next story preserved the light state. The root did not retain `.dark`.
- The Accessibility panel reported zero violations, six passes, and zero inconclusive results for Default in dark mode.
- The browser captured no console errors during this review.
- Autodocs rendered the Button examples and controls.
- The reviewer stopped the server. A final port check found no listener on port 6012.
- HEAD and all captured source hashes still matched after browser verification.

No staged format pass is necessary because the index contains no staged changes.
The reviewer added no unit tests. The decorators contain provider setup and a simple theme comparison, without non-trivial business logic.
No production code changed. Slice 2 did not start.

## Plan risks

The app CSS and Button render through the default Vite+ config merge.
The config adds no `viteFinal`. The review found no failure that requires one.
The current stories do not import the app API client, so they do not exercise its env validation.
No env validation error occurred during the verified Button renders.

## Matched SHA-256 values

| Path                                     | SHA-256                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `.storybook/main.ts`                     | `e7188367c27169994977d49fa4622ba7e6eb0563c3097025aa6e4c91a73ac1cf` |
| `.storybook/preview.ts`                  | `4e634d6240c74f0e691e287ee3c8b816489385f738d599b76071b10b25efff18` |
| `.storybook/decorators.ts`               | `e08250a3beaad3e51423c8610270d67e0dcb181b95d6b488e2113ebdba298005` |
| `package.json`                           | `a1a150ecb46ddc11b10d41b0ee894e4d1c56a8b8267d1cfe8e9115408cc70de6` |
| `pnpm-lock.yaml`                         | `afbe4c5d768620ef78af3fd2aa446450fcfc72c9befe53af3ceda8c850d7c034` |
| `.gitignore`                             | `9dd99a0abedb4be684e5b1502c66632300275f90754dc2dc4322e4bfea8a247f` |
| `src/shared/ui/button/Button.stories.ts` | `a514e3dfb64aed5966d4f79b2e5aeccafa019eaef76b0bfff320c8310e78cbb8` |

Lean: -1 lines possible.

Verdict: approve

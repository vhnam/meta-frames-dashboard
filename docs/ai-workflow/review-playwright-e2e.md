# Playwright E2E, Slice 1 review

What this change does: Slice 1 adds Playwright, limits Vitest discovery to source tests, and starts an isolated API and PostgreSQL container. The dashboard build uses the test API URL.

## [WARN]

1. **SIGTERM cannot stop a slow build** (`e2e/stack.ts:115`, `playwright.config.ts:28`)
   - **Problem:** `execFileSync` blocks the signal handler during `go build`. Playwright waits 10 seconds, then kills the stack process. The run can leave its container and temporary directory behind.
   - **Evidence:** A controlled `go build` fixture slept for 15 seconds. After SIGTERM and 11 seconds, the Node process and its labeled container still existed. They disappeared only after the build ended. A first build can exceed 10 seconds.
   - **Fix:** Make the build interruptible. Track its child process and stop it during cleanup. Ensure cleanup can identify the run container during long startup commands.

## Checks

- `vp check` passed: 435 formatted files and no lint or type errors in 417 files.
- `vp test` passed: 54 files and 215 tests. Vitest collected no E2E spec.
- The isolated API returned HTTP 200 from `/health`. Ctrl-C and SIGTERM each removed the run container and temporary directory after the API was ready.
- A forced Go build failure exited with status 1. It removed the run container and temporary directory.
- `stack.ts` uses the container ID returned by its own `docker run` and the directory returned by `mkdtempSync`. It does not run the server Makefile. The server starts in that directory with an explicit test `DATABASE_URL`. The dashboard uses `VITE_API_URL` from the Playwright web server configuration. I found no path to the developer database or developer `.env` in this slice.
- The changed files are within the Slice 1 allowed list. The executor recorded the built asset URL check and E2E type error check in the workspace progress log. I did not repeat those two checks.

Lean: -0 lines possible.

Verdict: request changes

## Round 2

The fix resolves finding 1. `docker run` and `go build` now run as asynchronous children. The signal handler can remove the run container and temporary directory before Playwright's 10-second limit.

### [NIT]

2. **A direct signal can leave a build descendant** (`e2e/stack.ts:60`)
   - **Problem:** `cleanup()` signals the direct `go build` child only. A process that the build starts can continue after the stack exits.
   - **Evidence:** In each slow-build test, a fake Go command started a 30-second `sleep` child. After a PID-targeted SIGTERM or SIGINT, Node exited within three seconds, but the child remained alive. I stopped each child after the check.
   - **Impact:** A direct PID-targeted signal can leave temporary CPU work. Playwright signals the process group, which includes the build descendants. A terminal Ctrl-C also signals the foreground process group.
   - **Fix if needed:** Stop the build process group when direct PID-targeted signals must stop all descendants.

### Checks

- `e2e/stack.ts` SHA-256 starts with `c76e0780`. The fix changed no other Slice 1 source file.
- Slow-build SIGTERM: one run container existed before the signal. No stack process, run container, or temporary directory remained after three seconds.
- Slow-build SIGINT: the same result. Both checks used a fake Go build and an isolated PostgreSQL container.
- `vp check` passed: 436 formatted files and no lint or type errors in 417 files.
- `vp test` passed: 54 files and 215 tests.
- I found no new blocking defect in the changed code. The previous isolation checks still apply.

Lean: -0 lines possible.

Verdict: approve

## Slice 2

What this change does: The fixtures create a unique account through an independent API request client. A1 tests the login redirect, session identity after reload, and logout through the real dashboard and API.

### Findings

No [CRITICAL], [WARN], or [NIT] findings for Slice 2.

### Scope and evidence

- Branch: `chore/setup-playwright`. Base and HEAD: `21762619639c07094133002b2c90345e8ae021fd`.
- Before this review update, Git reported only the two allowed untracked files. No staged or unstaged tracked changes existed.
- `e2e/fixtures.ts` SHA-256: `a17ded882a644260232e8bbef7bae62fe392b36ba4dda7154dde12ef0601d0be`.
- `e2e/auth.spec.ts` SHA-256: `debf0f9962fd95c246abb476f5926345b93d39f9a22e4811d4b1293c35b45b7e`.
- Both hashes remained unchanged after the checks below. The executor's deliberate redirect failure is recorded in the workspace progress entry. I did not repeat that edit.

### Checks

- `vp run e2e -g A1`: 1 passed in 13.3 seconds.
- `vp run e2e -g A1 --repeat-each=2`: 2 passed in 14.1 seconds. Logs showed distinct account emails for both repetitions.
- Assertions test the URL, account email, and API authentication results. No assertion tests copy or CSS. Accessible names identify controls only.
- `e2e/auth.spec.ts:23` registers the `/auth/me` response wait before `page.reload()` at line 26.
- Neither file uses a fixed sleep or a `networkidle` wait. Registration uses the standalone request cookie jar. The `signedIn` fixture uses the page context's request cookie jar.
- Failed-run cleanup: `vp run e2e -g A1 --timeout=1` exited 1 with `Test timeout of 1ms exceeded while setting up "context".` The API logged shutdown. No E2E container, temporary directory, or listener on ports 18080 and 4173 remained.
- Ctrl-C cleanup: interrupted `vp run e2e -g A1 --repeat-each=100` during its third test. The run reported 2 passed and 1 interrupted. No E2E container, temporary directory, or listener on either test port remained.
- `vp check`: passed, 438 formatted files and no lint or type errors in 419 files.
- `vp test run`: passed, 54 files and 215 tests.

Lean: -0 lines possible.

Verdict: approve

## Slice 3

What this change does: The seed helpers create stocks, cameras, and rolls through the signed-in account's API client. R1 adds rolls through the UI. R2 loads a roll and checks the saved camera assignment.

### [WARN]

1. **R1 does not check the refreshed inventory** (`e2e/rolls.spec.ts:31`)
   - **Problem:** Reload is followed only by independent API reads. R1 still passes if the API saves two rolls but the refreshed inventory omits them.
   - **Requirement:** The R1 spec requires the refreshed inventory to reflect the saved quantity.
   - **Fix:** After reload, check that the inventory represents both saved roll records. Use record identity or quantity, without assertions on copy or CSS.

2. **Unnamed controls require a plan decision** (`e2e/rolls.spec.ts:18`, `e2e/rolls.spec.ts:20`, `e2e/rolls.spec.ts:60`)
   - **Problem:** The spec uses selected text and placeholder names instead of associated form labels. The executor confirms the missing accessible names in the progress log.
   - **Requirement:** The authoring policy requires role and accessible name, or form label. The plan's Out of scope section requires the executor to stop and report controls without usable semantics.
   - **Assessment:** These locators work, and they are scoped to a dialog. They do not assert presentation. However, the plan does not authorize this fallback for unnamed controls.
   - **Fix:** Obtain Nam's approval for the fallback, or approve a separate accessibility slice before using label-based locators. Do not expand this slice's production file scope.

### Checks and evidence

- Base: `f99702c`. Before review, only `e2e/fixtures.ts` and `e2e/rolls.spec.ts` differed from the base. No scope violation was present.
- Reviewed SHA-256 values: fixtures `a1ffe96fbb62d7ff82cbc1e5db9f51effbe17fc31c1f1fbde8a1f34c72d628ba`; rolls spec `325639066fbe6d3effdd7c3f7030fc4eb75acc1ab7e1d9f48f5eb6c46c195517`.
- `vp run e2e -g R1`: 1 passed. `vp run e2e -g R2`: 1 passed.
- `vp run e2e`: 3 passed. `vp run e2e --repeat-each=2`: 6 passed.
- Seed requests succeeded against the real API. They use the authenticated page cookie jar. Bulk seeding uses a fresh `Idempotency-Key`.
- R1 checks two distinct IDs, stock ID, format 120, 24 exposures, and `in_stock`. R2 checks `in_camera`, the expected camera ID, and the camera link destination after reload.
- Both response waits precede the triggering button click. Neither test uses a fixed sleep or `networkidle`.
- R2 accepted-write check: I temporarily seeded a second owned camera and routed the load request to that camera. The request passed the success assertion. The persisted-state assertion failed with the expected and actual camera IDs different, while status remained `in_camera`. This proves the existing assertion catches an accepted wrong assignment. The executor's random-ID check proved rejection only.
- I restored the spec after that check. Both reviewed hashes matched again. No production file changed.
- After the deliberate failure, no E2E container, temporary stack directory, or listener on ports 18080 and 4173 remained.
- `vp check` passed. `vp test run` passed: 54 files and 215 tests. The final format, lint, and type check was repeated after restoration.

Lean: -0 lines possible.

Not checked: CI and later slices. No production code was edited.

Verdict: request changes

## Slice 3, round 2

What this change does: R1 now checks a visible inventory link for every saved roll after reload. The API assertions still require two distinct IDs and the requested stock, format, exposures, and status.

No new findings. WARN 1 is resolved. Nam approved the fallback locators from WARN 2 for this slice.

### Locator assessment

The locator at `e2e/rolls.spec.ts:37` is acceptable. It selects an anchor by its saved record URL. This is a record identity check, without dependence on classes, styling, copy, or element order. The test does not use this selector to operate an unnamed control. Each saved ID must have a visible link. `.first()` permits multiple links to one record without weakening the check for the other record.

The check runs inside the reload branch, after `page.reload()` and a fresh API read. The distinct-ID assertion at line 39 requires both saved rolls. The fix adds no sleep, `networkidle` wait, copy assertion, or CSS presentation assertion.

### Verification

- Base: `f99702c1f1a62cf17f40286fab49b88a8918e378`, branch `chore/setup-playwright`.
- Reviewed hashes remained unchanged after verification: fixtures `a1ffe96fbb62d7ff82cbc1e5db9f51effbe17fc31c1f1fbde8a1f34c72d628ba`, rolls spec `340ff8ae25ace9bd262dc5807d4c404ca0189314328862568edd3b9be1592906`.
- The existing review file changes are reviewer output. No new source file outside the allowed slice changed.
- `vp run e2e -g R1`: 1 passed in 16.8 seconds.
- `vp run e2e -g R2`: 1 passed in 12.8 seconds.
- `vp run e2e --repeat-each=2`: 6 passed in 20.2 seconds.
- `vp check`: passed, 439 formatted files and no lint or type errors in 420 files.
- The executor recorded a deliberate empty-inventory failure at the new visibility assertion. I read that evidence and did not repeat the production edit.

Lean: -0 lines possible.

Not checked: CI and later slices. No production code was edited.

Verdict: approve

## Slice 5

What this change does: A2 ends the session through the page context's API cookie jar. It then triggers a protected feature request from the open page, checks the login redirect, and signs in again.

### [WARN]

1. **Use the navigation link's accessible name** (`e2e/auth.spec.ts:64`)
   - **Problem:** The test operates a control through `a[href="/app/cameras"]` and `.first()`. The authoring policy requires role and accessible name, or form label.
   - **Evidence:** `AppSidebar.vue` renders the child navigation item as a link containing its title. `src/layouts/dashboard/nav.ts:34` supplies the title `Cameras`.
   - **Fix:** Use `page.getByRole('link', { name: 'Cameras', exact: true })`, scoped to the navigation region if necessary.
   - **Assessment:** The Slice 3 exception covered unnamed controls for that slice. It does not apply here. The record URL selector approved in Slice 3 asserted identity without operating a control.

### Behavior and scope

- `/app/cameras` is a valid interrupted location. The click starts navigation to that protected page, whose feature request encounters the expired session. The spec does not require restoring the page that preceded the interrupted navigation.
- The test uses the real API without routing or response mocks. Session termination uses `page.context().request`. The browser page remains open.
- The non-auth response wait at lines 60–63 is registered before the navigation click at line 64. Its predicate excludes `/auth/` responses and requires the test API origin. The response must be 401.
- The redirect assertion preserves `/app/cameras`. A later login returns to that URL, and an independent `/auth/me` read returns 200.
- No fixed sleep, `networkidle` wait, copy assertion, or CSS presentation assertion was added. The CSS selector finding concerns how the test operates the link.
- Before review, only the allowed `e2e/auth.spec.ts` differed from the base. `e2e/fixtures.ts` remained unchanged. No scope violation was present.

### Verification

- Base: `ff4ebdd3739110ec31d4a81929aaf2d57bf15a5d`, branch `chore/setup-playwright`.
- Reviewed hashes remained unchanged after checks: auth spec `d10746e083c2cc35e98a6c70cc2a34e30359dd8259dacb40e148403905494107`, fixtures `a1ffe96fbb62d7ff82cbc1e5db9f51effbe17fc31c1f1fbde8a1f34c72d628ba`.
- `vp run e2e -g A2`: 1 passed in 11.7 seconds.
- `vp run e2e --repeat-each=2`: 8 passed in 20.4 seconds.
- `vp check`: passed, 439 formatted files and no lint or type errors in 420 files.
- `vp test run`: passed, 54 files and 215 tests.
- The executor recorded the deliberate 401-handler failure. I read that evidence and did not repeat the production edit.

Lean: -0 lines possible.

Not checked: CI and later slices. No production code was edited.

Verdict: request changes

## Slice 5, round 2

What this change does: A2 now operates the Cameras navigation link through its role and exact accessible name. The response wait and behavior assertions are unchanged.

No new findings. The Slice 5 WARN is resolved.

- `e2e/auth.spec.ts:64` uses `page.getByRole('link', { name: 'Cameras', exact: true }).click()` without `.first()`. The successful strict locator click confirms a single matching link during A2 alone and both full-suite repetitions.
- The non-auth response wait remains at lines 60–63, before the click at line 64.
- The fix adds no sleep, `networkidle` wait, copy assertion, or CSS assertion. The accessible name identifies the control only.
- Only the allowed auth spec changed as executor work. The existing review document changes are reviewer output. Fixtures remain unchanged.

### Verification

- Base: `ff4ebdd3739110ec31d4a81929aaf2d57bf15a5d`, branch `chore/setup-playwright`.
- Hashes remained unchanged after checks: auth spec `bc8ca9905698c9df20c4a9ed236b9dc6c7693206a9f8774b77486d27cc8da244`, fixtures `a1ffe96fbb62d7ff82cbc1e5db9f51effbe17fc31c1f1fbde8a1f34c72d628ba`.
- `vp run e2e -g A2`: 1 passed in 11.6 seconds.
- `vp run e2e --repeat-each=2`: 8 passed in 20.4 seconds.
- `vp check`: passed, 439 formatted files and no lint or type errors in 420 files.
- I read the executor's deliberate 401-handler failure evidence. I did not repeat the production edit.

Lean: -0 lines possible.

Not checked: CI and later slices. No production code was edited.

Verdict: approve

## Slice 6

What this change does: R3 opens the same roll in two contexts for one account. It verifies that a stale edit fails, preserves the first saved edit, and recovers through the second context's edit form.

No findings.

### Behavior and scope

- Both edit dialogs open before either context saves (`e2e/rolls.spec.ts:123`). No intervening write changes their starting version.
- The first PUT succeeds and an independent API read returns exposures 24 (`e2e/rolls.spec.ts:129`). The stale second PUT returns 412. A fresh read still returns exposures 24 at line 137.
- The second context selects the current values through the UI. The form then contains exposures 24 at line 141. Its next save succeeds, and a fresh read confirms exposures 24 and price 5000 at line 146.
- The second context logs in with the same fixture account at lines 104–105. It has a separate cookie jar. All work after context creation at line 102 is inside the try block, and the finally block closes it at line 148, including on failed assertions.
- Each PUT response wait is registered before its Save changes click: lines 127–128, 133–134, and 143–144.
- No fixed sleep or `networkidle` wait appears in the tests. Assertions cover persisted state, HTTP results, record identity, URL, and form data. No assertion targets copy or CSS. The form value assertion verifies recovery to the current saved version.
- Placeholder locators comply with Nam's Fixed decision 8. The prior inspection of FormInput established the unlinked labels. No new named control is bypassed.
- Only `e2e/rolls.spec.ts` changed as executor work. The plan's Fixed decision 8 is an authorized parent-agent edit. Fixtures remain unchanged. No scope violation was present.

### Verification

- Base: `bc1b83323d46186855255aa79b5db471f37f1f8e`, branch `chore/setup-playwright`.
- Hashes remained unchanged after checks: rolls spec `db803400c3f649f10c10a26ce5ff3ea9da67d4dea162d2002d70c5d1b494f281`, fixtures `a1ffe96fbb62d7ff82cbc1e5db9f51effbe17fc31c1f1fbde8a1f34c72d628ba`.
- `vp run e2e -g R3`: 1 passed in 19.6 seconds.
- `vp run e2e --repeat-each=2`: 10 passed in 24.2 seconds.
- `vp check`: passed, 439 formatted files and no lint or type errors in 420 files.
- `vp test run`: passed, 54 files and 215 tests. `git diff --check` passed.
- I read the executor's deliberate missing If-Match failure evidence. I did not repeat the production edit.

Lean: -0 lines possible.

Not checked: CI and Slice 7. No production code was edited.

Verdict: approve

## Slice 7

What this change does: New helpers create a lab, a two-line order, and an eligible processing job. L1 links that job through the order detail UI and checks the exact saved line assignments before and after reload.

No findings.

### Behavior and contract

- The lab request matches `LabInput`. The order supplies the required lab ID, code, timestamp, and items with UUIDs, quantity, and unit price. The job supplies type `develop` and the same lab ID, after loading and finishing its roll.
- Server `LinkableJobs` permits jobs from the same lab on no order, or only this order. `syncOrderItems` requires owned lines from one order at the job's lab, with remaining capacity. The seeded job has no links and both quantity-one lines are empty. The product name does not impose a processing-type restriction.
- Fresh API reads at `e2e/lab-orders.spec.ts:52` occur before and after reload. The target line must contain exactly `[jobId]` at line 53. The other line must contain exactly `[]` at line 54. Missing lines also fail these assertions.
- Wrong-line proof: I temporarily routed the real PUT body to `{ orderItemIds: [firstLineId] }`. The server returned 200. L1 then failed its target-line equality assertion with expected `[jobId]`, received `[]`. This proves it detects an accepted wrong-line link, beyond the executor's empty-ID break. The test was restored afterward.
- The row filter at line 30 identifies a seeded record by its product name and scopes the Add button to that record. This complies with the authoring policy's record scoping rule. It is not a copy assertion or an unnamed form-control workaround. Fixed decision 8 does not need to cover it.
- The checkbox assertion checks the intended selection state. The link visibility assertion after reload checks saved roll identity. No assertion targets copy or CSS presentation.
- The PUT response wait at lines 38–42 is registered before the click at line 43. No fixed sleep or `networkidle` wait was added.

### Report accuracy and scope

- The separate executor statement “no .first()” is inaccurate: line 50 uses `.first()` in the saved-roll link assertion. This permits duplicate links to the same record without operating an arbitrary control. It does not weaken the exact API line checks.
- The workspace Slice 7 progress entry does not claim “no .first()”. Its file list, hashes, seed description, and line assertions match the reviewed code.
- Before review, only the allowed fixtures and lab-orders spec differed from the base. No scope violation was present. No production code was edited.

### Verification

- Base: `f21c72a45c66c520f3f468ea4a5831b7dd628060`, branch `chore/setup-playwright`.
- Reviewed hashes, confirmed again after restoration: fixtures `11aa93a4cee8be10b32e804888ab086bd3a232659cf9f94f37c97ccb158801d2`, lab-orders spec `fb12ac16afa521460f50075727e5708fc33ea5f89fa070427e83b3d0b5fb2aa8`.
- `vp run e2e -g L1`: 1 passed in 20.9 seconds.
- `vp run e2e --repeat-each=2`: 12 passed in 29.9 seconds.
- `vp check`: passed, 440 formatted files and no lint or type errors in 421 files.
- `vp test run`: passed, 54 files and 215 tests. These checks ran on the reviewed hashes before the temporary wrong-line test edit.

Lean: -0 lines possible.

Not checked: CI. The browser runs used the local sibling server checkout.

Verdict: approve

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

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

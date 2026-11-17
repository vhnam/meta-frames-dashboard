# Plan: Playwright E2E for the dashboard

- Spec: [spec-playwright-e2e.md](spec-playwright-e2e.md) (Astra). This plan does not change the spec.
- Track: Full-Track. The work adds a new test layer and touches more than 3 files. It is not high-risk: it changes no auth, payment or data code.
- Repository: `meta-frames-dashboard`. The server repository is read-only for this plan.
- Branch: `chore/setup-playwright`.
- Progress log: the workspace file `docs/progress.md` (one entry per slice).

## Reuse analysis

- Existing patterns reviewed: Vitest with happy-dom and `src/test/fakeServer.ts` for component tests. `vite.config.ts` holds all Vite+ settings. `.vite-hooks/` holds Git hooks. The server reads all settings from environment variables (`internal/config/config.go`) and applies migrations before it listens (`cmd/api/main.go:73`).
- Chosen approach: New, plus Extend. Playwright Test is a new tool. There is no browser test layer to extend. The suite extends `vite.config.ts` (Vitest scope) and uses the existing API for all test data.
- Reasoning: the fake server cannot show cookie, CORS, deep-link or persistence defects. Those defects are the goal of the spec.
- Duplication risk: Low. Specs share one fixture file. Locators stay in each spec until the spec authoring policy says otherwise.

## Architecture

```
playwright.config.ts
  webServer[0]  node e2e/stack.ts          -> ready at http://127.0.0.1:18080/health
                  docker run postgres:18-alpine  (random loopback port, run label)
                  go build ./cmd/api  (from E2E_SERVER_DIR, default ../meta-frames-server)
                  start the binary with test env, cwd = temp dir
                  SIGTERM -> stop binary, docker rm -f <own container>, delete temp dir
  webServer[1]  vp build && vp preview --host 127.0.0.1 --port 4173 --strictPort
                  env VITE_API_URL=http://127.0.0.1:18080   -> ready at http://127.0.0.1:4173
  projects      chromium only
e2e/fixtures.ts  test.extend: unique account, API login in the page cookie jar, seed helpers
e2e/*.spec.ts    one file per area (auth, rolls, later lab orders)
```

Fixed decisions:

1. The suite never uses the developer stack. `reuseExistingServer` is `false` locally and in CI. An occupied port 4173 or 18080 stops the run. This removes any path to the developer database.
2. `e2e/stack.ts` runs on Node 26 type stripping (`node e2e/stack.ts`). It needs no extra runner. Keep it to erasable syntax only (`erasableSyntaxOnly` is already on).
3. The server binary gets an explicit environment and a temp working directory. Required values: `PORT=18080`, `DATABASE_URL` for the run container, `CORS_ORIGINS` and `APP_URL` set to `http://127.0.0.1:4173`, `API_URL=http://127.0.0.1:18080`, `STORAGE_DIR` in the temp directory. Leave `ENV`, SMTP and Google settings unset. With `ENV` unset the session cookie is not `Secure`, so it works over plain HTTP.
4. `stack.ts` removes only resources it created: the container ID it started and the temp directory it made. Every container carries the label `meta-frames-e2e=<run id>`.
5. Vite gives process environment variables priority over `.env`. The dashboard build therefore uses the test API URL even when a developer `.env` exists. Slice 1 checks this in the built assets.
6. Test data uses `@example.test` emails with a unique part per test and per retry: `e2e-<testId>-<retry>-<random>@example.test`. One fixed password satisfies the server rules (8+ characters, upper, lower, digit, symbol).
7. Config values follow the spec: 1 worker, 0 local retries, 1 CI retry, `trace: 'retain-on-first-failure'`, `screenshot: 'only-on-failure'`, HTML report with `open: 'never'`, `failOnFlakyTests` in CI.
8. Locator fallback (Nam, 2026-11-17, for all remaining slices of this plan): a form control whose label is not linked in the DOM may be located by role plus its placeholder name, or by role plus `filter({ hasText })` inside a dialog. Use this only when role plus accessible name and `getByLabel` do not work. A control that has a usable accessible name must use it. The label fix in `src/` stays out of scope.

## In scope

- Spec stages 1 to 3: tooling, the isolated stack, A1, R1, R2, and the CI job definition.
- Spec stage 4: P1 cases A2, R3 and L1, one slice each, after Nam approves each one.
- A README section that lists prerequisites (Docker, Go, the server checkout) and the run command.

## Out of scope

- Any change to `meta-frames-server` or `meta-frames-app`.
- Visual snapshots, validation permutations, Google sign-in, email delivery.
- WebKit and Firefox projects.
- New `data-testid` attributes or other production component changes. If a control has no usable role, label or accessible name, the executor stops and reports.
- A CHANGELOG entry. The E2E suite is not a user-facing change.
- Running E2E in the pre-commit or pre-push hooks.
- Saved auth state files.

## Slices

Run slices in order. Each slice leaves `vp check` and `vp test` passing. Nam approves each slice before the next one starts.

### Slice 1: Tooling and isolated stack

- Executor: Sonnet.
- Allowed files: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `.gitignore`, `README.md`, `playwright.config.ts` (new), `e2e/stack.ts` (new), `e2e/tsconfig.json` (new).
- Tasks:
  1. Add `@playwright/test` (latest) as a dev dependency with pnpm. Add the script `"e2e": "playwright test"`, which runs as `vp run e2e`.
  2. In `vite.config.ts`, add `test.include: ['src/**/*.test.ts']`. Vitest then collects no file under `e2e/`.
  3. Write `e2e/stack.ts` to Architecture decisions 2, 3 and 4. Print server output to the console so that run logs contain backend errors. Exit nonzero when Docker, Go or the server directory is missing, with a message that names the missing item.
  4. Write `playwright.config.ts` to the Architecture diagram and decisions 1 and 7. Set `gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 }` on the API web server. Give the API web server a startup timeout that covers an image pull and a Go build (180 s).
  5. Add `e2e/tsconfig.json`. It extends `../tsconfig.json`, sets `types: ["node"]`, and includes `e2e/**/*.ts` and `../playwright.config.ts`. Add `@types/node` only if it is missing (it is present now).
  6. Add `test-results/`, `playwright-report/`, `blob-report/` and `playwright/.auth/` to `.gitignore`.
  7. Add a short "End-to-end tests" section to `README.md`.
- Acceptance criteria:
  - `node e2e/stack.ts` starts, and `curl http://127.0.0.1:18080/health` returns 200.
  - After SIGTERM, `docker ps -a --filter label=meta-frames-e2e` shows no container, and the temp directory does not exist.
  - When the server directory is missing, `stack.ts` exits nonzero and leaves no container.
  - The built `dist/` contains `http://127.0.0.1:18080` when `VITE_API_URL` is set, with a developer `.env` present.
  - A deliberate type error in `e2e/stack.ts` makes `vp check` fail. If `vp check` does not read `e2e/tsconfig.json`, stop and report. Do not move E2E files into `src/`.
  - `vp check` and `vp test` pass. `vp test` collects the same 54 files as before.

### Slice 2: Fixtures and A1

- Executor: Sonnet.
- Allowed files: `e2e/fixtures.ts` (new), `e2e/auth.spec.ts` (new).
- Tasks:
  1. In `e2e/fixtures.ts`, extend `test` with an `account` fixture. It registers a unique account (decision 6) through `POST /auth/register` from the standalone `request` fixture, so that the browser context stays anonymous. Add a `signedIn` fixture. It logs in through `page.context().request` (`POST /auth/login`), so that the page and the request client share one cookie jar.
  2. In `e2e/auth.spec.ts`, implement A1 from the spec test plan. Use `account` only. Register the `/auth/me` response wait before the action that triggers it.
- Acceptance criteria:
  - `vp run e2e` passes A1 twice in a row. Each run creates a new account.
  - A1 fails when the login page ignores the `redirect` search parameter. Check this once on a local edit, then revert the edit and record the observed assertion in the progress entry.
  - No fixed sleeps and no `networkidle` waits.

### Slice 3: R1 and R2

- Executor: Sonnet.
- Allowed files: `e2e/fixtures.ts`, `e2e/rolls.spec.ts` (new).
- Tasks:
  1. Add seed helpers to `e2e/fixtures.ts` that use the signed-in request client: create a film stock (`POST /film-stocks`), create a camera (`POST /cameras`), add rolls (`POST /rolls/bulk` with an `Idempotency-Key`).
  2. Implement R1 and R2 from the spec test plan in `e2e/rolls.spec.ts`. Drive the action under test through the UI. Read the result back through the API (`GET /rolls?filmStockId=…`, `GET /rolls/{id}`) and after a page reload.
- Acceptance criteria:
  - A1, R1 and R2 pass together, and each passes alone (`vp run e2e -g R2`).
  - R1 asserts exactly 2 new distinct roll IDs with the requested format and exposures and status `in_stock`.
  - R2 asserts status `in_camera` and the selected camera ID on a fresh read.

### Slice 4: CI job (blocked on a decision)

- Executor: Sonnet, after Nam gives the inputs below.
- Nam must decide two items. First, the CI provider (the repository has no workflow now). Second, how CI gets the server: read access to the server repository, or a versioned server image.
- Allowed files: one workflow file for the chosen provider. Exact path after the decision.
- Tasks:
  1. Install locked dependencies, and install Chromium with its system dependencies.
  2. Provide Docker and Go. Check out the server at a recorded SHA.
  3. Run `vp run e2e`. Upload the HTML report and traces with a 7-day retention.
  4. Record both commit SHAs in the job output.
- Acceptance criteria: the spec stage 3 exit criteria.

### Slices 5 to 7: P1 cases

- Executor: Sonnet. One case per slice, in this order: A2, R3, L1.
- Allowed files: the area spec file (`e2e/auth.spec.ts`, `e2e/rolls.spec.ts`, or `e2e/lab-orders.spec.ts` new) and `e2e/fixtures.ts`.
- Acceptance criteria: the spec pass condition for that case. The case passes alone and with the full suite.

## Test plan

The spec test plan table is the test plan. This plan adds these rules for the executor and for Sol:

- Each P0 assertion targets persisted state, identity or the URL. No assertion targets copy, headings, CSS classes or element order.
- Each slice records one deliberate break of the behavior under test and the assertion that caught it.
- Sol checks that each spec passes alone and in a run with a different `--repeat-each=2`.
- Sol checks `stack.ts` cleanup after a failed run and after Ctrl-C.

## Risks

- First run time: the Postgres image pull and the Go build can take more than 1 minute. The 180 s web server timeout covers this. Slice 1 records the measured time.
- Port conflict: a developer process on 4173 or 18080 stops the run. Decision 1 requires this behavior.
- Orphan containers: if the runner receives SIGKILL, the container can stay. The run label lets a developer remove it with `docker rm -f $(docker ps -aq --filter label=meta-frames-e2e)`. The README lists this command.
- Server drift: locally the suite uses whatever revision the sibling checkout has. Slice 4 fixes this for CI with a recorded SHA.

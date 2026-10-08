# Meta-Frames Dashboard

A web dashboard for tracking analog film photography: rolls, cameras, lenses, film stocks, labs
and processing jobs. It is the front end for the Meta-Frame REST API.

## Features

- **Accounts** (`/auth`): log in with email and password or with Google, sign up, and reset a
  forgotten password by email. The dashboard lives under `/app` and needs a session; `/` is
  kept for public pages.
- **Rolls**: list grouped by status (In stock, In camera, Done shooting, At lab, Developed,
  Scanned), bulk add, edit, delete, and a detail page with gear, frames, costs and processing
  history.
- **Roll lifecycle**: load into a camera, manage lenses, mark as finished, send to a lab (or
  self-develop) with scanner orders, then record scans received and negatives returned. Expected
  dates turn red when overdue.
- **Gear**: cameras (including fixed-lens) and lenses.
- **Film & lab**: film stocks, inventory, expiry overview and labs.
- **Audit log**: the last 200 changes, with the changed fields.
- Sortable, filterable, paginated tables. List page and page size are kept in the URL.

See [CHANGELOG.md](CHANGELOG.md) for details.

## Tech stack

- [Vue 3](https://vuejs.org/) + TypeScript
- [Vite+](https://viteplus.dev/) (`vp`) for dev server, build, lint, format and tests
- [TanStack Router](https://tanstack.com/router), [Query](https://tanstack.com/query) and
  [Table](https://tanstack.com/table)
- [shadcn-vue](https://www.shadcn-vue.com/) (style `reka-nova`) on [Reka UI](https://reka-ui.com/),
  [Tailwind CSS 4](https://tailwindcss.com/), [Tabler icons](https://tabler.io/icons)
- [Formisch](https://formisch.dev/) + [Valibot](https://valibot.dev/) for forms and validation
- [axios](https://axios-http.com/) for HTTP, [vue-sonner](https://vue-sonner.vercel.app/) for toasts

## Getting started

### Prerequisites

- [Vite+ CLI](https://viteplus.dev/guide/) (`vp`). It manages Node and pnpm (pnpm 12.9.1 is
  pinned in `package.json`).
- A running Meta-Frame API (default `http://localhost:8080`).

### Setup

```sh
vp install
cp .env.example .env
vp dev
```

### Environment variables

| Variable       | Default                 | Description                     |
| -------------- | ----------------------- | ------------------------------- |
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the Meta-Frame API. |

The session is an HTTP-only cookie, so every request is sent with credentials. The API must allow
this app's origin with credentials (CORS), and its `APP_URL` must point at this app: recovery
emails link to `{APP_URL}/recover/end` and Google sign-in returns to `{APP_URL}/app/...` or
`{APP_URL}/login?error=...`. The app forwards `/login` and `/recover/end` to their `/auth` pages.

## Scripts

| Command        | Description                                       |
| -------------- | ------------------------------------------------- |
| `vp dev`       | Start the dev server.                             |
| `vp run build` | Type check with `vue-tsc`, then build to `dist/`. |
| `vp preview`   | Serve the production build.                       |
| `vp check`     | Format, lint and type check.                      |
| `vp test`      | Run the tests (Vitest + happy-dom).               |

Run `vp check` and `vp test` before you commit.

## Project structure

```
src/
├── app/            # entry point, providers, router
├── features/       # one folder per domain
│   ├── audit/
│   ├── auth/
│   ├── cameras/
│   ├── film-stocks/
│   ├── labs/
│   ├── lenses/
│   └── rolls/
├── layouts/        # dashboard shell, sidebar, header, navigation
├── shared/
│   ├── api/        # axios instance, QueryClient, mutation helper
│   ├── components/ # app components (DataTable, FormDialog, ...)
│   ├── lib/        # formatting, schema and utility helpers
│   └── ui/         # shadcn-vue components
├── styles/         # Tailwind entry and theme
└── test/           # fake API server and shared test helpers
```

The `#/` import alias points to `src/`.

### Feature modules

Each folder in `src/features/` has the same layout:

- `api.ts`: query keys, `queryOptions`, API-to-domain mapping and write functions.
- `queries.ts`: composables (`useXList`, `useSaveX`, ...) built on TanStack Query and
  `useApiMutation`.
- `types.ts`, `schema.ts`, `format.ts`: domain types, Valibot schemas and display labels.
- `routes.ts`: TanStack Router routes, registered in `src/app/router.ts`.
- `pages/` and `components/`: Vue views.
- `index.ts`: the public API of the feature. Other features import only from here.

Server state lives only in the TanStack Query cache. Each mutation names the query keys it
invalidates, and mutation errors show as a toast with the server message.

## Testing

Tests sit next to the code as `*.test.ts`. `src/test/fakeServer.ts` is an in-memory stand-in for
the Meta-Frame API. It plugs into the real axios instance, so tests run the same request and
response mapping as the app.

## Adding UI components

shadcn-vue is configured in `components.json`. New components go to `src/shared/ui`.

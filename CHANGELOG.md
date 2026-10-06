# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-06

### Added

- Audit log page (`/audit`) backed by `GET /audit-logs`, showing the last 200 changes with the
  changed fields. Set `VITE_ACTOR` to send an `X-Actor` header that attributes your changes.
- Expected dates on processing jobs: `scansExpectedAt` for scan and develop + scan jobs, and
  `negativesExpectedAt` for lab jobs that develop (develop, develop + scan). Each shows in
  Processing history and turns red with "(overdue)" until the scans are received or the
  negatives are returned.
- `Idempotency-Key` on bulk roll adds so a retried request does not create the rolls twice.
- The list page and page size are kept in the URL, and Back from a detail page returns to the
  same page of its list.
- Meta-Frame API integration through axios (`VITE_API_URL`, default `http://localhost:8080`) for
  cameras, lenses, film stocks, inventory, labs and rolls. API errors keep their HTTP status and
  show the server message.
- Roll writes through the API: add rolls with `POST /rolls/bulk`, edit with `PUT /rolls/{id}`
  (expiry is sent as a nested `expiry: { year, month }` object) and delete with `DELETE /rolls/{id}`.
- Roll detail page backed by `GET /rolls/{id}`, including the camera, its lenses, the base stock,
  processing history, frames and cost totals.
- Processing history on the roll detail page: each job shows its ordered scanners (Noritsu HS-1800,
  Frontier SP-3000, Other) with a hi-res flag, and offers Scans received, Negatives
  returned, Edit and Delete. The card shows the roll's finished date (`finishedAt`) when the API
  sends one. The roll status follows the API. Send to lab picks the scanners for scan and
  develop + scan jobs and sends `scanOrders` (Meta-Frame API 0.4.0).
- Roll list view groups rolls into status tabs (All, In stock, In camera, Done shooting, At lab,
  Developed, Scanned), each with a count.
- `DataTable` built on TanStack Table with sortable columns, a `SearchField`, column filters in the
  table headers, a Reset button and an empty state built on `Empty`.
- Edit and Delete actions for cameras, lenses, film stocks, labs and rolls.
- Readable labels for film type (`B&W`, `Color`, `Slide`) and packaging (`Factory`, `Repack`,
  `Re-spooled`).
- Placeholders on every text, number and select field.
- shadcn-vue `Select` with the option label shown in the trigger, and the `Empty` and
  `DropdownMenu` components.
- Pagination on every list: a "Result per page" select (10, 20 or 50, default 10), the visible
  range with the total, and first, previous, page number, next and last controls.
- Roll actions through the API, from Roll detail:
  - Load into camera (`PUT /rolls/{id}/load`) with camera, date loaded and shot ISO; shown in the
    Camera & lenses card for in-stock rolls. A camera that already has a roll loaded is left out
    of the list, because a camera can hold only one roll.
  - Manage lenses (`PUT /rolls/{id}/lenses`) with the lenses linked to the roll's camera; shown
    for rolls on a camera that is not fixed-lens.
  - Mark as finished (`PUT /rolls/{id}/finish`); shown in Processing history for rolls in a camera.
  - Send to lab (`PUT /rolls/{id}/processing/{jobId}`) with lab (or self-develop), service,
    process, price, date sent, notes and scanners; shown on Processing history while the roll can
    still be sent (done shooting, or scan and print once it has been developed).
- Roll detail has a separate "Camera & lenses" card.
- Expiry month is picked by name (January to December) in Add roll and Edit roll.
- Colored badges for film type, process and packaging on the film stock list.
- Rolls opens in List view; Expiry is built from the rolls list.
- Test fake server (`src/test/fakeServer.ts`) and tests for the API layer, tables, filters, dialogs
  and the camera, lens, stock, roll and expiry screens.

### Changed

- Project restructured into `app/`, `features/` (rolls, cameras, lenses, film-stocks, labs),
  `shared/` (ui, components, composables, api, lib), `layouts/`, `stores/` and `styles/`. Each
  feature owns its `api.ts`, `queries.ts`, `types.ts`, `schema.ts`, `components/`, `pages/`,
  `routes.ts` and `index.ts`. Routing moved from file-based to code-based routes collected in
  `app/router.ts`; `@tanstack/router-plugin` was removed. shadcn-vue aliases in `components.json`
  point at `src/shared/`.
- Cameras, Lenses, Film Stocks, Inventory, Labs, Expiry and Rolls use the same filterable list
  layout. Cameras and Lenses only manage gear information; rolls are managed from Rolls.
- The roll list "Stock" column shows brand and name.
- The audit log table stays within the page. A row opens a sheet from the right with the full
  change. Create, update and delete each have their own color.
- shadcn-vue style in `components.json` is `reka-nova`.
- The roll list Status column filter is replaced by the status tabs.
- `DataTable` headers are emphasized, and the column filter icon fills in while that filter is
  active.
- Sorting is off for Mount, Description and Active on Cameras, and for Format and Status on Rolls.
- Page title is "Meta Frames | Dashboard".
- Select dropdowns use the shadcn-vue `Select` instead of the native element.
- Form fields align at the top when a neighbouring field has a hint or an error.
- Dialogs always render a description, hidden from view when none is given.

### Removed

- Board view on the rolls list. Rolls stay in the status-tab list.
- Offline mode: the browser-stored data layer, the artificial-latency setting, the CSV import and
  the `idb-keyval` dependency.
- Screens and actions that have no API endpoints yet: Overview, Negatives at Lab, Statistics,
  Search by focal length, CSV Import, the processing-job page, frame notes and scan import.
- `@tanstack/router-plugin` and the generated `routeTree.gen.ts`; route code splitting is no longer
  automatic.
- "Updated just now" and the Refresh button under lists.
- The Camera and Lens filters on Rolls.
- The scan count column in Processing history.

### Fixed

- Saving the list page in the URL stays on the current route, so the pager's search params
  type-check.
- Editing a roll cleared its shot ISO, dates and description, because the API replaces the roll
  on `PUT /rolls/{id}`. The list now reads `shotIso` and `description`, and the edit resends them.
- Edit camera form opened empty when its details had not loaded yet.
- Toast notifications were unstyled because the `vue-sonner` stylesheet was not loaded.
- The select arrow sat against the edge of the field.
- Expiry was not saved when adding or editing rolls: the API reads a nested
  `expiry: { year, month }` object and ignores flat `expiryYear` and `expiryMonth` fields.
- "Not found" pages for missing cameras, stocks and rolls never showed, because API errors lost
  their HTTP status.
- Empty filters showed a blank value instead of "All …".
- Console warning about a missing `Description` on `DialogContent`.

[Unreleased]: https://github.com/vhnam/meta-frames-dashboard/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vhnam/meta-frames-dashboard/releases/tag/v1.0.0

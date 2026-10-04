# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Meta-Frame API integration through axios (`VITE_API_URL`, default `http://localhost:8080`) for
  cameras, lenses, film stocks, inventory, labs and rolls. API errors keep their HTTP status and
  show the server message.
- Roll writes through the API: add rolls with `POST /rolls/bulk`, edit with `PUT /rolls/{id}`
  (expiry is sent as a nested `expiry: { year, month }` object) and delete with `DELETE /rolls/{id}`.
- Roll detail page backed by `GET /rolls/{id}`, including the camera, its lenses, the base stock,
  processing history, frames and cost totals.
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
  - Load into camera (`PUT /rolls/{id}/load`) with camera, date loaded and shot ISO; shown for
    in-stock rolls.
  - Manage lenses (`PUT /rolls/{id}/lenses`) with the lenses linked to the roll's camera; shown
    for rolls on a camera that is not fixed-lens.
  - Mark as finished (`PUT /rolls/{id}/finish`); shown for rolls in a camera.
  - Send to lab (`PUT /rolls/{id}/processing/{jobId}`) with lab (or self-develop), service,
    process, price, date sent and notes; shown for rolls that are done shooting.
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
- The roll list "Stock" column and the board cards show brand and name.
- Sorting is off for Mount, Description and Active on Cameras, and for Format and Status on Rolls.
- Page title is "Meta Frames | Dashboard".
- Select dropdowns use the shadcn-vue `Select` instead of the native element.
- Form fields align at the top when a neighbouring field has a hint or an error.
- Dialogs always render a description, hidden from view when none is given.

### Removed

- Offline mode: the browser-stored data layer, the artificial-latency setting, the CSV import and
  the `idb-keyval` dependency.
- Screens and actions that have no API endpoints yet: Overview, Negatives at Lab, Statistics,
  Search by focal length, CSV Import, the processing-job page, frame notes and scan import.
- `@tanstack/router-plugin` and the generated `routeTree.gen.ts`; route code splitting is no longer
  automatic.
- "Updated just now" and the Refresh button under lists.
- The Camera and Lens filters on Rolls.

### Fixed

- Edit camera form opened empty when its details had not loaded yet.
- Toast notifications were unstyled because the `vue-sonner` stylesheet was not loaded.
- The select arrow sat against the edge of the field.
- Expiry was not saved when adding or editing rolls: the API reads a nested
  `expiry: { year, month }` object and ignores flat `expiryYear` and `expiryMonth` fields.
- "Not found" pages for missing cameras, stocks and rolls never showed, because API errors lost
  their HTTP status.
- Empty filters showed a blank value instead of "All …".
- Console warning about a missing `Description` on `DialogContent`.

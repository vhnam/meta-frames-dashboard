# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Meta-Frame API integration through axios (`VITE_API_URL`, default `http://localhost:8080`) for
  cameras, lenses, film stocks, inventory, labs and rolls. API errors keep their HTTP status and
  show the server message.
- Roll writes through the API: add rolls with `POST /rolls/bulk`, edit with `PUT /rolls/{id}`
  (`expiryYear` and `expiryMonth` are sent as flat fields) and delete with `DELETE /rolls/{id}`.
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
- Rolls opens in List view; Expiry is built from the rolls list.
- Test fake server (`src/test/fakeServer.ts`) and tests for the API layer, tables, filters, dialogs
  and the camera, lens, stock, roll and expiry screens.

### Changed

- Cameras, Lenses, Film Stocks, Inventory, Labs, Expiry and Rolls use the same filterable list
  layout. Cameras and Lenses only manage gear information; rolls are managed from Rolls.
- Select dropdowns use the shadcn-vue `Select` instead of the native element.
- Form fields align at the top when a neighbouring field has a hint or an error.
- Dialogs always render a description, hidden from view when none is given.

### Removed

- Offline mode: the browser-stored data layer, the artificial-latency setting, the CSV import and
  the `idb-keyval` dependency.
- Screens and actions that have no API endpoints yet: Overview, Negatives at Lab, Statistics,
  Search by focal length, CSV Import, the processing-job page, Load into camera, Finish roll,
  Send to lab, lens changes on a roll, frame notes and scan import.
- "Updated just now" and the Refresh button under lists.
- The Camera and Lens filters on Rolls.

### Fixed

- Edit camera form opened empty when its details had not loaded yet.
- Toast notifications were unstyled because the `vue-sonner` stylesheet was not loaded.
- The select arrow sat against the edge of the field.
- Expiry was not saved on rolls: the API reads `expiryYear` and `expiryMonth`, not a nested object.
- "Not found" pages for missing cameras, stocks and rolls never showed, because API errors lost
  their HTTP status.
- Empty filters showed a blank value instead of "All …".
- Console warning about a missing `Description` on `DialogContent`.

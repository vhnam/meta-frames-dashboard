# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

This release needs a Meta-Frame API with lab orders (`/lab-orders`).

### Added

- An Orders page under Film & Lab records what a lab billed: code, dates, lines with product, options, quantity and unit price, then VAT, discount and total. An order's page shows the rolls on each line, and adds or removes them. Only rolls already sent to that lab, and on no order yet, can be added.
- The Send to Lab and Edit Processing Job dialogs pick an order line for a lab job. A job on an order links to it from the roll's Processing history.

### Changed

- A job on an order takes its price from the line, with the order's VAT and discount shared out by price, and the Price field is hidden. Work at home and jobs on no order keep the Price field.

## [2.1.0] - 2026-11-03

This release needs a Meta-Frame API that serves a film stock's `boxIso` as a string and accepts a
`date` when a roll is finished.

### Added

- A "Complete" badge on the Rolls list and the roll page for a Developed or Scanned roll whose
  negatives are back from the lab. It is not a new status: a later re-scan or print opens the
  roll again.
- A "Page not found" page for unknown addresses. Under `/app` it shows inside the dashboard,
  with links back to Rolls and to the previous page; elsewhere it shows as a standalone page
  with a link home. Visitors who are not signed in still go to the login page for `/app` paths.
- A lens page at `/app/lenses/:id`, in the film stock page's look: a header card with focal
  length, aperture, mount and status, the roll the lens is shooting now and the number of rolls
  shot; numbered sections for specifications and optics & notes; and a side column with the
  camera a built-in lens belongs to and every roll shot with the lens. The Lenses list opens it.
- A Re-scan action in a roll's Processing history, once the roll has been developed or
  scanned, to scan the negatives again at another lab or at home. Earlier jobs and their scans
  stay. "Send to lab" is then hidden, so print jobs are only offered for a roll's first job.
- Scanning or printing at home is labelled "Self-scan (at home)" or "Self-print (at home)" in
  place of "Self-develop", and a new scan at home starts with your first own scanner picked
  (none when you have none); picking a lab switches it to the lab's default scanner (the
  Noritsu HS-1800 for a lab that names none, and no scanner for a lab that names scanners but no
  default) until the scanners are changed by hand.
- A Scanners page at `/app/scanners` (under Film & Lab) listing the built-in Noritsu HS-1800 and
  Frontier SP-3000, which are shared and read-only, next to your own scanners: another lab's
  machine, a flatbed or a camera rig, each with a brand, an optional model (a lab's Noritsu of
  unknown model is just "Noritsu"), optional kind and Markdown notes
  (edited with the rich text editor, shown as plain text in the list). Every row opens: a
  built-in scanner shows read-only, with its kind and default scan settings. Your
  scanners can be added, edited and deleted (not while a job or scan uses them).
- Labs name the scanners they run: the Add/Edit Lab dialog has a Scanners section to tick them,
  an optional default (a "Default" switch on each ticked scanner, which moves it to the top), and an
  "Add a scanner this lab runs" button. The Labs list shows each lab's scanners.
- The scanner picker of Send to lab, Re-scan and job editing lists the chosen lab's scanners,
  in its order, with "Show all scanners" for the rest; at home, or for a lab that names none, it
  lists every scanner you can use. An "Add a scanner of your own" button creates one and orders
  it straight away.
  Jobs show each scanner by its name from the API.
- Scan settings follow the scanner's kind in place of the Hi-res checkbox: a minilab offers
  resolution and file format; a flatbed or film scanner dpi, bit depth, dust removal and
  multi-exposure; a camera rig file format, pixel shift and shots stitched. Every scanner offers
  the framing: cropped, with the film border, or with border and sprockets. Each ordered
  scanner shows its settings in one line that opens into the fields, and starts from the
  scanner's default settings, which the scanner dialog edits. The job history lists the settings
  of each scanner.
- Developing or scanning at home records when the negatives were developed and the roll was
  scanned, both today by default, so the job is complete as soon as it is saved. Dates a lab
  would give ("expected back") are not asked for. Editing a home job can change both dates.
- Edit processing job can change the service and the process. A developing job switches
  between Develop and Develop + scan, a scan or print job between Scan and Print, and a job
  with imported scans keeps scanning. The lab is now fixed instead.

### Changed

- "Negatives back" in a roll's Processing history shows Done once the negatives are back, never
  "X days late", because they can come back with the scans.
- The Dates section of a processing job has three rows: "Sent to Lab" (was "Date sent"), then
  scans expected and received, then negatives expected and received (was "Negatives returned").
- "Mark as finished" on a roll opens a dialog to choose the finish date, starting on today. The
  date cannot be in the future or before the roll was loaded.
- A film stock's box ISO can be a range as well as a single speed, like 100-400 or 50-200. Loading
  a roll of such a stock offers the two ends of the range as quick picks.
- Toasts have a Close action, so a message can be dismissed before it times out.
- A lens is named by its brand and model on the Lenses list, the lens page and the camera page.
  The focal length and aperture no longer repeat in the name.
- Delete comes first in the actions on the camera, lens and film stock pages.
- Each job in a roll's Processing history reads top to bottom: the lab, with the service,
  process and price on one line under it; a Dates table with a row for sending the roll (or
  starting it at home) and for each thing that comes back (negatives, prints or scans), giving
  the expected date, the actual date and a status: Done, late by some days, overdue by some
  days in red, due in some days, or Waiting when no date is set; each ordered scanner with its
  settings as tags ("Default settings" when none were changed); and the notes last.
- Processing history lists the latest job first, by date sent.
- Environment variables are validated at startup with t3-env and valibot
  (`src/shared/lib/env.ts`). An invalid `VITE_API_URL` stops the app with an error naming the
  variable; an empty one falls back to the default.
- List tables open a record by clicking anywhere on its row (or Enter on a focused row), with a
  chevron at the end of the row. Rolls, Film stocks, Inventory, Expiry, Cameras and Lenses open
  the detail page; Labs, which have no detail page, open the edit dialog.
- List tables no longer have Edit and Delete buttons on each row. Edit and Delete are on each
  record's detail page; for labs, Delete is in the edit dialog.
- New look for the film stock page: a header card with the stock's type, process, box ISO,
  packaging and origin, unexposed rolls with a per-format breakdown, the next expiry and the
  number of rolls shot; numbered sections for specifications and provenance & notes; and a
  side column with related stocks and every roll of the stock. "Add rolls" on the page opens
  Add rolls with the stock already chosen.
- The camera page uses the same look: a header card with mount and status, the loaded roll,
  the number of lenses and of rolls shot; numbered sections for specifications and notes; and
  a side column with linked lenses (each opens its lens page, and "Manage" sits on the section)
  and every roll shot in the camera.
- The Add / Edit camera and lens dialogs share the film stock dialog's look: numbered sections
  (camera body or lens, lens & mount or optics, notes), required fields marked with an
  asterisk, quick picks for common focal lengths and apertures, and Cancel / Save fixed to the
  bottom.
- The Add rolls and Edit roll dialogs share the same look: numbered sections for film,
  purchase and expiry, required fields marked with an asterisk, quick picks for exposures and
  quantity, and Cancel / Save fixed to the bottom. The Add button shows how many rolls it adds.
- Load into camera uses the same look: the roll in its own section, then camera and date
  loaded, then the shot ISO with quick picks for pulling one stop, box speed, and pushing one
  or two stops.
- Send to lab and Edit processing job use the same look: numbered sections for the roll, lab
  & service, scans (for jobs with scanning), dates and notes. The note that the roll becomes
  At Lab moved to the dialog's description.
- The Add / Edit lab dialog uses the same look, with the required Name marked by an asterisk.
- The Mount field on cameras and lenses is a searchable list of every mount already used by a
  camera or lens. Typing a mount that is not in the list adds it, so a camera can get a new
  mount (for example L39) before any of its lenses exist.
- The camera and lens Brand fields work the same way: pick a brand already used by a camera or
  lens, or type a new one.
- The Brand and Mount lists show how many cameras and lenses use each value, so a one-off typo
  is easy to spot.
- New look for the Add / Edit film stock dialog: fields on white, grouped into numbered
  sections (specifications, chemistry & format, provenance & notes), required fields marked
  with an asterisk, quick picks for common box speeds (100, 200, 400, 800), process names
  in the Process picker, the base stock in its own panel, and Cancel / Save fixed to the bottom
  while the form scrolls.
- Descriptions of film stocks ("Darkroom notes & characteristics"), cameras and lenses use a
  rich text editor with bold, italic, strikethrough, code, headings, lists, quotes, undo and
  redo. They are saved as Markdown, so existing plain-text descriptions keep working. Stock,
  camera and roll pages show descriptions formatted; list tables show them as plain text.
- Lab job notes in the Send to lab dialog use the same rich text editor, and the roll page shows
  them formatted.
- The Cameras, Lenses and Film stocks lists no longer show the description under the name.
- The camera Manage lenses dialog shows each lens's focal length, aperture and mount under its
  name.
- "Film tracker" under the sidebar logo is in the accent colour, as on the account pages.
- Dates show as dd/mm/yyyy: the Started column and field of rolls, the finish date and job dates
  in Processing history and Send to lab, and the audit log (with the time as HH:mm).
- Processing jobs show "Scans received" only for services that scan and "Negatives received"
  only for services that develop, in Processing history and in Edit processing job.

### Fixed

- The brand list of Add Lens and Add Camera counts only that kind of gear, so one Nikon lens and
  one Nikon camera no longer read as "Nikon 2" when adding a lens. Brands used only on the other
  kind stay listed with no number, and brands that differ only by invisible characters merge into
  one.
- A print job, and a scan job at a lab, can record the day the negatives came back. A print job
  used to stay open, keeping the roll At lab, and a lab scan kept "Negatives at lab" on the roll
  for good. A print at home records the day it was printed.
- In Add rolls, choosing 135 or 120 sets the default exposures again (36 or 12).

## [2.0.0] - 2026-10-08

### Added

- Accounts under `/auth`: log in (`/auth/login`), sign up (`/auth/register`), forgot password
  (`/auth/recover`) and set a new password from the emailed link (`/auth/recover/end`), backed by
  the API's `/auth/*` endpoints. Passwords are checked against the API's rule (8+ characters
  with upper and lower case, a digit and a symbol) before they are sent.
- Sign in with Google from the login and sign-up pages. Failed Google sign-ins show the reason
  on the login page.
- A user menu in the sidebar footer with the signed-in name and email, and Log out.
- `/login` and `/recover/end` forward to their `/auth` pages, so the API's Google error redirect
  and recovery email links work.

### Changed

- New look for the dashboard: a warm paper theme with a darkroom-orange accent, Space Grotesk
  headings over Geist Mono, a dotted content background and larger page titles.
- Restyled sidebar: an aperture logo with "Film tracker" under the name, upper-case section
  labels, a bordered active item, the roll count next to Rolls, dot bullets for Cameras and
  Lenses, and the signed-in user in a card at the bottom. Labs has a flask icon.
- The sidebar header and top bar are shorter (56px instead of 76px), with a smaller logo.
- The header has an Alerts bell with a red count of in-stock rolls expired or expiring within 6
  months. It opens a panel that lists them, most overdue first, with how long ago each roll
  expired or how soon it expires. Each alert opens its roll, and "See all" opens the Expiry page.
  Hovering or focusing the bell shows a tooltip with the count.
- Account pages (log in, sign up, forgot and reset password) match the new look: the logo above
  a card with a film-strip edge, upper-case field labels, a show/hide toggle on password fields,
  a full-colour Google button, and errors and notices with an icon.
- Sign-up requires a full name.
- Delete prompts open a confirmation dialog in the app's style instead of the browser's
  `confirm` box.
- Fonts (Geist Mono and Space Grotesk) are bundled from Fontsource instead of loaded from
  Google Fonts, so they work offline and need no third-party request.
- Every list screen (rolls, cameras, lenses, film stocks, inventory, expiry, labs, audit log)
  shares one table style: the name in bold with a detail line under it, values such as mount,
  type and format in small tags, status badges with a dot, aligned digits for numbers, upper-case
  headers, an Actions column with Edit and Delete, and an "Add …" button with a + icon.
- Table search runs on Apply (or Enter) instead of while typing. The button then reads Applied
  until the keyword changes, and an X inside the search box clears it. This replaces the Reset
  button.
- The rows-per-page select and page controls sit in the table footer and show on every list
  that has rows; the first and last page buttons are gone.
- Rolls list: the stock cell shows film type, exposures and ISO; the format shows its size
  (`135 / 35mm`); the roll description shows under the camera; status tabs show empty counts
  as a plain zero and the At lab count in red.
- Cameras list: the description shows under the camera name, and inactive cameras are listed
  too (dimmed) instead of behind a "Show inactive" button.
- Lenses list: a built-in lens shows "Built into <camera>" under its name and a "Built-in" mount
  tag.
- The Active filter on Cameras and Lenses always offers Any status, Active and Inactive, even
  when every row has the same status.
- Expiry lists rolls without an expiry date in their own table.
- The dashboard moved under `/app` (for example `/app/rolls`) and needs a session. Visitors are
  sent to `/auth/login` and return to the page they asked for after logging in. `/` is reserved
  for public pages and opens the app for now (breaking: old links such as `/rolls` no longer
  work).
- Requests send the session cookie (`withCredentials`). When the API answers `401`, the app
  returns to the login page and drops the previous user's cached data, as Log out does.

### Removed

- `VITE_ACTOR` and the `X-Actor` header. The API names the signed-in user as the actor of
  audit entries.

### Fixed

- The collapsed sidebar: icons, the logo and the user avatar are centred in a wider (64px) rail
  instead of overflowing their 32px buttons.
- In the collapsed sidebar, Gear opens a menu with Cameras and Lenses. Before, it could not be
  clicked.

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

[Unreleased]: https://github.com/vhnam/meta-frames-dashboard/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/vhnam/meta-frames-dashboard/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/vhnam/meta-frames-dashboard/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/vhnam/meta-frames-dashboard/releases/tag/v1.0.0

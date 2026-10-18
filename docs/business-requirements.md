# Business requirements (as built)

This document restates the business rules that the code enforces today, module by module. It was
written from the source, not from the use-case spec, so it shows what the product actually does.
Its purpose is to be set against [business-review.md](business-review.md): every review finding
is checked against these rules in the last two sections.

Sources:

- Server: `meta-frames-server` at `6a65fe3`, including the uncommitted change to processing
  (process can be corrected on edit; home jobs can record negatives returned).
- Dashboard: `meta-frames-dashboard` at `34fbd9e` with its working tree.

Each rule carries a tag that says where it is enforced:

- **[API]** – the server refuses a request that breaks the rule. Any client is bound by it.
- **[UI]** – only the dashboard applies the rule. A direct API call can break it.
- **[API only]** – the server supports the behaviour, but the dashboard has no screen or
  control for it.

Error codes are the `code` field of the server's problem response.

---

## 0. Accounts and ownership

### Requirements

- **AC-1 [API]** A visitor registers with name, email and password. The email must be valid and
  unique. The password needs at least 8 characters with an upper-case letter, a lower-case
  letter, a digit and a symbol. The API takes the password once; the client asks for it twice.
- **AC-2 [API]** Login uses email and password. Five wrong passwords within 15 minutes lock the
  account for 15 minutes (`account_locked`, HTTP 429).
- **AC-3 [API]** A session lives in the `metaframes_session` HTTP-only cookie for 7 days. It is
  stored in `user_session`, so logout ends it on the server.
- **AC-4 [API]** Password recovery sends an email link to `{AppURL}/recover/end?token=…`. A
  successful reset ends every session of the account and lifts any lockout.
- **AC-5 [API]** Sign in with Google is available only when a Google client is configured;
  otherwise the routes answer `not_configured`. The sign-in:
  - refuses an email that Google has not verified;
  - signs in the account already linked to that Google identity;
  - otherwise links the account that has the same email, unless that account is linked to a
    different Google identity;
  - otherwise creates a new account.
- **AC-6 [API]** Every record (camera, lens, film stock, lab, roll, processing job, frame, scan,
  audit entry) belongs to one account. A user sees and changes only their own records. Composite
  foreign keys stop a record from pointing at another account's record.

---

## 1. Cameras

### Data

Brand, model, mount, description, fixed-lens flag, active flag. A camera has no film format.

### Requirements

- **CA-1 [API]** Brand and model are required (`missing_fields`).
- **CA-2 [API]** An interchangeable-lens camera needs a mount (`mount_required`). A fixed-lens
  camera has no mount (`mount_not_allowed`). The database enforces the same rule.
- **CA-3 [API]** Creating a fixed-lens camera needs the built-in lens: focal length, max
  aperture with at most one decimal, optional brand and model (`fixed_lens_required`). The
  server creates that lens, marks it built-in and links it to the camera in the same
  transaction.
- **CA-4 [API]** The fixed-lens flag cannot change after creation (`fixed_lens_immutable`).
- **CA-5 [API]** A camera that holds a roll (status In camera) cannot be deactivated
  (`camera_loaded`). Its built-in lens is activated and deactivated together with it.
  **[UI]** The dashboard does not disable the toggle; the user sees the error after clicking.
- **CA-6 [API]** Only a camera that has never held a roll can be deleted (`camera_in_use`). Its
  built-in lens is deleted with it. A used camera can only be deactivated.
- **CA-7 [API]** Lenses can be linked only to an interchangeable-lens camera
  (`fixed_lens_camera`). The linked set is replaced as a whole. A built-in lens cannot be linked
  to another camera (`built_in_lens`). An inactive lens cannot be newly linked, but stays linked
  if it already was (`inactive_lens`).
- **CA-8** The lens mount is not checked against the camera mount. **[UI]** Lenses with the same
  mount are listed first in the picker.
- **CA-9 [API]** The camera list and detail show the roll currently loaded: stock, shot ISO
  (box ISO when not pushed or pulled), start date and days loaded.
- **CA-10 [UI]** The built-in lens details are entered only when the camera is created. The
  camera edit form does not change them.

---

## 2. Lenses

### Data

Brand, model, mount, description, focal length, max aperture, built-in flag, active flag.

### Requirements

- **LE-1 [API]** Focal length > 0. Max aperture > 0 with at most one decimal (`invalid_aperture`).
- **LE-2 [API]** A standalone lens needs brand, model and mount (`missing_fields`). A built-in
  lens has no mount (`mount_not_allowed`); its brand and model are optional.
- **LE-3 [API]** A built-in lens cannot be activated or deactivated by itself; it follows its
  camera (`built_in_lens`). It cannot be deleted by itself; it goes with its camera.
- **LE-4 [API]** A lens that was used on any roll cannot be deleted (`lens_in_use`). It can be
  deactivated.
- **LE-5 [API]** The list can show active lenses only, and can put lenses of a preferred mount
  first.

---

## 3. Film stocks and inventory

### Data

Brand, name, type (`color`, `bw`, `slide`), box ISO, process (`C-41`, `E-6`, `BW`, `ECN-2`),
packaging (`factory`, `repack`, `respooled`), stock origin, pack origin, description, base stock.

### Requirements

- **FS-1 [API]** Brand and name are required. Type, process and packaging must be one of the
  listed values. Box ISO > 0.
- **FS-2 [API]** A stock can name a base stock (a repack or respool of another film). The base
  must exist, cannot be the stock itself (`base_stock_self`) and cannot form a cycle
  (`base_stock_cycle`).
- **FS-3 [API]** Non-blocking warnings, returned with the stock:
  - black-and-white film whose process is not BW;
  - slide film whose process is not E-6;
  - factory packaging with a pack origin.
    **[UI]** The form shows the first two. It does not warn about colour negative film on E-6 or
    BW.
- **FS-4 [API]** The stock detail shows its base stock, its siblings (other stocks with the same
  base) and the stocks derived from it.
- **FS-5 [API]** A stock that has rolls or derived stocks cannot be deleted
  (`film_stock_in_use`).
- **FS-6** Type, process and box ISO stay editable when rolls of the stock exist. A change
  applies to every roll of that stock, including rolls already shot.
- **FS-7 [API]** Inventory lists stocks that have rolls In stock, with a count per format and
  the soonest expiry. It filters by type, process and ISO.

---

## 4. Rolls

### Data

Film stock, format (integer), exposures, purchase price, expiry year and month, status, camera,
lenses, shot ISO, start date, finish date, description, created date.

### Lifecycle

```
In stock ──load──▶ In camera ──finish──▶ Done shooting ──first job──▶ At lab
                                                                       │
                                     all jobs closed, scans received ──┼──▶ Scanned
                                     all jobs closed, no scans ────────┴──▶ Developed
```

- **RO-1 [API]** Statuses: `in_stock`, `in_camera`, `done_shooting`, `at_lab`, `developed`,
  `scanned`.
- **RO-2 [API]** After processing starts, the status is derived from the jobs: At lab while any
  job is open; otherwise Scanned if any job has a scans-received date; otherwise Developed. See
  PR-6 for when a job is open.
- **RO-3 [API]** No transition goes backward, except that deleting the last job of a roll
  returns it to Done shooting (PR-12).

### Adding rolls

- **RO-4 [API]** Rolls are added in bulk: stock, format, exposures, quantity, price, expiry.
  The server creates one record per physical roll.
- **RO-5 [API]** Exposures default to 36 for 135 when omitted. Other formats require exposures
  (`exposures_required`). Exposures > 0.
- **RO-6 [API]** Format is an integer ≥ 1 with no list of allowed values. **[UI]** The dashboard
  offers `135`, `120`, `110` and `4x5`. Choosing 135 sets 36 exposures and choosing 120 sets 12.
  Choosing 110 or 4×5 leaves the count unchanged. **Defect:** the dashboard sends
  `Number("4x5")`, which is `NaN` and is serialised as `null`, so a 4×5 roll cannot be saved.
- **RO-7 [API]** An expiry month requires a year (`expiry_year_required`) and must be 1–12.
- **RO-8 [API]** With an `Idempotency-Key`, a retried request returns the rolls of the first
  attempt instead of creating more. A retry while the first is still running gets
  `request_in_progress`.

### Editing a roll

- **RO-9 [API]** The edit replaces stock, format, exposures, price, expiry, shot ISO, start
  date, finish date and description.
- **RO-10 [API]** The stock can change only while the roll is In stock (`stock_locked`).
  **[UI]** The form still offers the stock picker at every status.
- **RO-11** Format, exposures, price and expiry can change at every status. Exposures are not
  compared with the frames the roll already has.
- **RO-12 [API]** When both dates are sent, the finish date cannot be before the start date
  (`invalid_dates`).
- **RO-13 [API]** A shot ISO equal to the box ISO is stored as empty (shot at box speed).
- **RO-14 [UI]** The edit form covers stock, format, exposures, price and expiry only. It sends
  back the stored shot ISO, dates and description unchanged. **[API only]** Correcting shot ISO,
  dates or description.

### Loading, lenses, finishing, deleting

- **RO-15 [API]** Only an In stock roll can be loaded (`roll_not_in_stock`). Loading the same
  roll into the same camera again changes nothing.
- **RO-16 [API]** The camera must exist, be active (`camera_inactive`) and hold no other roll
  (`camera_loaded`). A database index allows one In camera roll per camera.
- **RO-17 [API]** Loading sets the start date (default today) and the shot ISO.
- **RO-18 [API]** A fixed-lens camera puts its built-in lens on the roll automatically. If the
  camera has no linked lens, loading fails (`fixed_lens_data_error`). For other cameras the
  lenses are optional at load time. **[UI]** The dashboard does not send lenses at load; they
  are chosen afterwards.
- **RO-19 [API]** Loading an expired roll is allowed, with the warning "roll is expired".
- **RO-20** The camera is not checked against the roll format.
- **RO-21 [API]** The lenses of a roll can be replaced once it has a camera, at any later status
  (`roll_not_loaded` before that). They cannot change on a fixed-lens camera
  (`fixed_lens_camera`). An inactive lens cannot be newly added. A lens does not have to be
  linked to the roll's camera. **[UI]** The picker offers only the camera's linked lenses and
  hides "Manage lenses" for a fixed-lens camera.
- **RO-22 [API]** Only an In camera roll can be finished (`roll_not_in_camera`). The finish date
  defaults to today. The finish date is not compared with the start date. **[UI]** The dashboard
  always sends no date. **[API only]** Finishing on an earlier date.
- **RO-23 [API]** Only an In stock roll can be deleted (`roll_not_in_stock`). There is no way to
  unload a roll, move it to another camera or delete it once loaded.

### Roll detail, list and expiry

- **RO-24 [API]** The detail shows the roll, stock, base stock, lenses, jobs, frames, warnings
  and cost. Cost is purchase price plus all job prices. It is marked incomplete when any price
  is missing.
- **RO-25 [API]** "Negatives at lab" is true when any job at a lab has no negatives-returned
  date, whatever the job type. The badge is shown only on Developed and Scanned rolls.
- **RO-26 [API]** The list filters by status, stock, camera, lens, format and start-date range.
- **RO-27 [API]** Expiry ends on the last day of the expiry month, or on 31 December when the
  month is unknown. The expiry report lists In stock rolls that are expired or expire within 6
  months, soonest first, plus In stock rolls with no expiry. Rolls in a camera or later are never
  in the report. **[UI]** The alerts bell and the Expiry page use this report.

---

## 5. Labs

- **LA-1 [API]** A lab has a name (required) and an address. It has no list of processes or
  scanners.
- **LA-2 [API]** A lab with any processing history cannot be deleted (`lab_in_use`). Jobs that
  were deleted still count.

---

## 6. Processing jobs

### Data

Roll, lab (empty means done at home), type (`develop`, `develop_scan`, `scan`, `print`), process,
sent date, scans expected, negatives expected, scans received, negatives returned, price, notes,
scan orders (scanner and hi-res flag; scanners `noritsu`, `frontier`, `other`).

### Creating a job

- **PR-1 [API]** A job's id is chosen by the client; the same PUT creates or edits it.
- **PR-2 [API]** A roll can be sent:
  - when Done shooting, for any type;
  - when Developed or Scanned, for `scan` or `print` only (`invalid_job_type`);
  - never in any other status (`roll_not_ready`). This includes At lab, so a roll gets no new
    job while another job is open.
- **PR-3 [API]** Creating a job sets the roll to At lab.
- **PR-4 [API]** The process defaults to the stock's process. A different process is accepted
  without any sign that it is a cross-process.
- **PR-5 [API]** The sent date defaults to today. Scans expected applies only to `develop_scan`
  and `scan`; negatives expected only to `develop` and `develop_scan`. Neither expected date can
  be before the sent date.
- **PR-6 [API]** A job is open until its expected result arrives:
  - `develop_scan` and `scan`: until a scans-received date is recorded;
  - `develop` and `print`: until a negatives-returned date is recorded.
- **PR-7 [API]** `develop_scan` and `scan` need at least one scanner; other types take none
  (`scan_orders_required`, `scan_not_applicable`). A scanner appears once per job
  (`duplicate_scanner`). The lab's own scanners are not checked.
- **PR-8 [API]** Nothing stops a second job at another lab while negatives are still at the
  first lab.

### Editing and closing a job

- **PR-9 [API]** A job's roll and type cannot change (`job_immutable`). Lab, dates, price, notes,
  process and scanners can. A scanner that already has scans cannot be removed
  (`scanner_has_scans`). **[UI]** The lab is fixed when editing.
- **PR-10 [API]** Scans received can be recorded only for `develop_scan` and `scan`
  (`no_scans_expected`). Negatives returned can be recorded for any job, including home jobs
  (since the uncommitted change). Both default to today. Neither is compared with the sent
  date. There is no way to clear either date.
- **PR-11 [API]** Recording a receipt recomputes the roll status (RO-2).
- **PR-12 [API]** A job with scans cannot be deleted (`job_has_scans`). After a delete the roll
  status is recomputed. If no job is left, the roll returns to Done shooting. **[UI]** The
  Delete button is shown on every job.

### Dashboard behaviour

- **PR-13 [UI]** "Send to lab" appears only when the roll has no jobs and is Done shooting.
  Afterwards only "Re-scan" appears (a `scan` job), on Developed and Scanned rolls. **[API only]**
  A `print` job after the first job.
- **PR-14 [UI]** The send form starts on "at home" with both receipt dates set to today. Either
  date can be cleared, and a cleared date is not sent. Saving a home job is up to three requests
  in a row (create the job, record scans, record negatives) without a transaction.
- **PR-15 [UI]** On edit, a receipt date is sent only when it is non-empty and different from
  the stored one.
- **PR-16 [UI]** The "Negatives returned" field is shown only for `develop` and `develop_scan`.
  **Defect:** a `print` job cannot be closed from the dashboard (PR-6), so the roll stays At lab.
  A `scan` job at a lab keeps "Negatives at lab" true forever (RO-25).
- **PR-17 [UI]** A new lab job defaults to the Noritsu scanner; a home job defaults to "other".
- **PR-18 [API only]** The list of jobs whose negatives are still at a lab, with days since sent.
  It includes `scan` and `print` jobs.

---

## 7. Frames and scans

- **FR-1 [API]** A frame is identified by its number on the roll (≥ 0). It exists when it has a
  note or a scan. Setting a note creates the frame. The number is not compared with the roll's
  exposures, and notes can be added at any status, In stock included. **[API only]** The
  dashboard shows frames but cannot create or edit them.
- **SC-1 [API]** Scans can be imported only into `develop_scan` and `scan` jobs
  (`no_scans_expected`), and only for a scanner ordered on the job (`scanner_not_ordered`). The
  job may already be closed.
- **SC-2 [API]** The import preview reads the frame number from the end of each file name and
  adds an offset, or numbers files in name order from a start frame. It flags files that are not
  images, have no number, or would get a negative number.
- **SC-3 [API]** A file must be a JPEG, PNG, WebP or TIFF (checked from its content) of at most
  40 MB. Each file is saved on its own, so earlier files survive a later failure.
- **SC-4 [API]** A job holds one scan per frame and scanner. An existing scan is skipped, or
  replaced when replace is requested.
- **SC-5 [API]** When an import saves at least one file and the job has no scans-received date,
  the date is set to today and the roll status is recomputed.
- **SC-6 [API]** Compare shows the Noritsu and Frontier scans of one frame, which scanner is
  missing, and the previous and next frame numbers.
- **SC-7 [API]** Deleting a scan is a soft delete; the file stays in storage. The job's
  scans-received date and the roll status do not change.
- **SC-8 [API only]** The dashboard has no screens for import, scan browsing, compare or scan
  delete.

---

## 8. Search and statistics

All **[API only]**: the dashboard has no screens for them.

- **ST-1** Search by focal length returns the rolls shot with a lens of that focal length, with
  their scans.
- **ST-2** Gear ranks cameras and lenses by number of rolls, all time or for one start year.
  Rolls In stock are not counted.
- **ST-3** Film ranks stocks by number of rolls (not In stock), optionally grouped by base stock.
- **ST-4** Timeline counts rolls per month of their start date.
- **ST-5** Spending sums per month and year. Film cost is dated by when the roll was added (no
  purchase date is stored). Processing cost is dated by the sent date. A missing price counts as
  zero and marks the month incomplete.

---

## 9. Audit log

- **AU-1 [API]** Database triggers record every create, update and delete of the account's
  records. The log filters by entity type, entity id and action, newest first, 50 per page by
  default and 200 at most.

## 10. Cross-cutting rules

- **X-1 [API]** Deletes are soft: the row gets `deleted_at` and drops out of every query.
- **X-2 [API]** Clients choose the ids of cameras, lenses, stocks, labs and jobs. A create with an
  id that exists gets `already_exists`.
- **X-3 [API]** Text fields are trimmed; an empty string is stored as empty.

---

## Comparison with the business review

Verdicts:

- **Confirmed** – the gap exists in the current rules.
- **UI only** – the API already supports the behaviour; only the dashboard is missing it.
- **Incorrect** – the review describes behaviour the code does not have.
- **Partly** – part of the finding holds; the note says which part.

| #   | Review finding                                                                            | Rules                     | Verdict   | Note                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------- | ------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A roll loaded into the wrong camera cannot be unloaded, moved or deleted                  | RO-15, RO-23              | Confirmed | No unload or move in the API either.                                                                                             |
| 2   | Mark as finished sends no date                                                            | RO-22                     | UI only   | API accepts `date`. API does not compare it with the start date.                                                                 |
| 3   | Shot ISO cannot be corrected after load                                                   | RO-9, RO-14               | UI only   |                                                                                                                                  |
| 4   | Film not shot in a catalogued camera must be loaded and finished first                    | PR-2                      | Confirmed |                                                                                                                                  |
| 5   | Prints only on the first job                                                              | PR-2, PR-13               | UI only   | API allows `print` on Developed and Scanned rolls.                                                                               |
| 6   | A print job does not record that negatives left the house                                 | RO-25, PR-6               | Incorrect | The opposite: print and scan jobs count as negatives at lab, and the dashboard cannot close them (PR-16).                        |
| 7   | Deleting the only job leaves the roll with no next action                                 | PR-12                     | Incorrect | Roll returns to Done shooting and "Send to lab" is shown again.                                                                  |
| 8   | Re-scan ignores "Negatives at lab"                                                        | PR-8                      | Confirmed | Neither UI nor API checks it.                                                                                                    |
| 9   | Home work can be saved unfinished; three requests                                         | PR-14                     | Confirmed | Also an API gap: no atomic way to record a finished home job.                                                                    |
| 10  | A receipt date cannot be cleared                                                          | PR-10, PR-15              | Confirmed | No API to clear it.                                                                                                              |
| 11  | A job with imported scans can be deleted                                                  | PR-12                     | Incorrect | API refuses with `job_has_scans`. The UI shows a button that will fail.                                                          |
| 12  | Dates are not ordered                                                                     | PR-5, PR-10, RO-12, RO-22 | Partly    | Expected dates and the edit form's start/finish are checked. Receipt dates and the finish action are not. The UI checks nothing. |
| 13  | Stock can change on a scanned roll                                                        | RO-10                     | Incorrect | API refuses with `stock_locked`; the UI still offers the picker.                                                                 |
| 14  | Format, exposures, price and expiry editable at every status; exposures below frame count | RO-11                     | Confirmed |                                                                                                                                  |
| 15  | Description has no field                                                                  | RO-14                     | UI only   |                                                                                                                                  |
| 16  | Push or pull is only a note                                                               | PR-4                      | Confirmed | No field in the data model.                                                                                                      |
| 17  | Cameras have no format                                                                    | RO-20                     | Confirmed |                                                                                                                                  |
| 18  | Lenses of another mount can be linked                                                     | CA-8                      | Confirmed | Also true for roll lenses (RO-21).                                                                                               |
| 19  | A camera with film in it can be deactivated                                               | CA-5                      | Incorrect | API refuses with `camera_loaded`; the UI does not disable the toggle.                                                            |
| 20  | Fixed-lens rolls may not get the built-in lens                                            | RO-18                     | Incorrect | The API attaches it at load.                                                                                                     |
| 21  | Expiry watches the freezer only; year without month is December                           | RO-27                     | Confirmed | A design decision rather than a defect.                                                                                          |
| 22  | 110 and 4×5 keep the previous exposure count; 120 sizes; no 220                           | RO-6                      | Confirmed | Also: 4×5 cannot be saved at all (see G-1).                                                                                      |
| 23  | Frames cannot be created                                                                  | FR-1                      | UI only   | API has `putFrame`.                                                                                                              |
| 24  | Colour negative on E-6 or BW gets no warning; job cross-process not flagged               | FS-3, PR-4                | Confirmed |                                                                                                                                  |
| 25  | Any lab can take any process; jobs default to Noritsu                                     | LA-1, PR-7, PR-17         | Confirmed |                                                                                                                                  |

## Gaps the review does not mention

| #    | Gap                                                                             | Rules               | Impact                                                                         |
| ---- | ------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| G-1  | 4×5 rolls cannot be saved: the dashboard sends `NaN` as the format              | RO-6                | Add and edit fail for 4×5. The API also accepts any integer as a format.       |
| G-2  | A `print` job never closes from the dashboard                                   | PR-6, PR-16         | The roll stays At lab with no way forward in the UI.                           |
| G-3  | A `scan` or `print` job at a lab keeps "Negatives at lab" true                  | RO-25, PR-16, PR-18 | The badge and the negatives-at-lab list never clear.                           |
| G-4  | Stock type, process and ISO stay editable when rolls exist                      | FS-6                | Editing a stock rewrites the history of rolls already shot.                    |
| G-5  | Frame notes can be added to an In stock roll, with any frame number             | FR-1                | Frames above the exposure count, or on unshot film.                            |
| G-6  | Deleting scans leaves the scans-received date and the Scanned status            | SC-7                | A roll can be Scanned with no scans.                                           |
| G-7  | Roll lenses can be changed at any status and need not belong to the camera      | RO-21               | Gear statistics can count lenses never used with that camera.                  |
| G-8  | A lab with only deleted jobs cannot be deleted                                  | LA-2                | Minor.                                                                         |
| G-9  | No dashboard screens for scans, compare, search, statistics or negatives at lab | SC-8, ST-1–5, PR-18 | A large part of the API is unused.                                             |
| G-10 | Several controls are shown although the API will refuse them                    | CA-5, RO-10, PR-12  | Delete job with scans, deactivate a loaded camera, change stock after loading. |
| G-11 | Film spending is dated by when the roll was added, not bought                   | ST-5                | Rolls entered later skew the monthly figures.                                  |

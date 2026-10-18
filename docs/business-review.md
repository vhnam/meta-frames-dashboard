# Business review

The tracker covers a roll from the freezer to the lab, and several real paths stop halfway. The holes are in reversing a mistake, ordering work after the first job, and keeping film, camera, and dates consistent once a roll has been shot.

A roll moves **In stock → In camera → Done shooting → At lab → Developed or Scanned**. Developing happens once. After that the only follow-up is a re-scan. One camera holds one roll. Work at home is supposed to be finished the moment it is saved.

## Workflows the product cannot finish

**A roll loaded into the wrong camera stays there.** Load is offered only while the roll is in stock, and nothing unloads it, moves it to another body, or deletes it afterward. Delete exists only for in-stock rolls. The camera stays occupied until the roll is marked finished, and Mark as finished sends no date — the API stamps today — so a roll finished last week cannot be recorded as such. Shot ISO is written only at load; the edit form cannot correct a push later.

**There is no path for film that never went through a catalogued camera.** An unshot roll to be developed, or a roll shot in a borrowed body, still has to be loaded and finished before Send to lab appears.

**Prints exist only on the first job.** After a develop-only job, Re-scan is the only follow-up. Ordering prints later, or prints from a scan, is not available. A print job also does not record that the negatives left the house.

**Deleting the only lab job can leave the roll with no next action.** Send to lab is shown only when there are no jobs and the roll is Done shooting. Re-scan is shown only once the roll is Developed or Scanned. If deleting that job leaves the status at At lab, both buttons disappear.

**A second lab can be booked while the negatives are still at the first.** Re-scan does not look at the "Negatives at lab" flag, so a scan at lab B can be created while the film is still at lab A.

## Rules the screens only half enforce

**Home work can be saved unfinished.** The form defaults both receipt dates to today, and both fields can be cleared. A blank date is not sent, so a home develop-and-scan can be stored with neither date. The save is also three requests in a row (create the job, then scans received, then negatives returned). If a later request fails, the roll is left with an open job.

**A receipt date cannot be taken back.** Edit sends a receipt only when the new date is non-empty and different from the saved one. Clearing "Scans received" does nothing. Deleting the whole job is allowed even when that job has imported scans, while the scanner itself is locked and cannot be removed.

**Dates are not ordered.** Scans can be expected before the roll was sent, and negatives can be marked returned before the day it was sent. The same is true of a finish that would fall before the day the roll was loaded. The job type says an expected date is not before the sent date; the form does not check that.

**A shot roll can be rewritten into a different film.** Edit stays available at every status and can change stock, format, exposures, price, and expiry, including on a scanned roll. Exposures can be set below the number of frames the roll already has. The roll description is kept on save and has no field, so it cannot be written or changed. Push or pull at the lab is only a note, not a value on the job.

**The camera is not checked against the film.** Cameras have no format, so a 120 roll can be loaded into a 35mm body. Lenses of another mount can be linked to a camera; same-mount lenses are only sorted first. A camera with film in it can be deactivated. A fixed-lens camera hides Manage lenses, and Load does not attach the built-in lens, so those rolls may never count on the lens page unless the API does that itself.

**Expiry watches the freezer only.** The bell and the Expiry page list in-stock rolls. Film that has been in a camera for a year never alerts. A year with no month is treated as the end of December.

## Formats and chemistry

**110 and 4×5 keep the previous exposure count.** Choosing 135 sets 36 and 120 sets 12. Choosing 110 or 4×5 does not change the number, so a sheet of 4×5 can be stored as 36 exposures. 120 is always suggested as 12, which is 6×6; 6×4.5, 6×7, and 6×9 (16, 10, and 8) are not suggested. 220 is not a format.

**Frames are shown and never created.** The roll page lists frame notes and scan counts when the API sends them. Nothing in the app adds a frame, so "finished at frame 19" cannot be recorded.

**Cross-process is easy to miss.** The stock form warns when black-and-white film is not process BW, and when slide film is not E-6. Color negative on E-6 or BW gets no warning. A lab job can use a different process from the stock with no sign that it is a cross-process.

**Any lab can take any process.** Labs are a name and an address. Every lab job starts on a Noritsu until the scanners are changed, including a lab that only runs C-41.

## What already holds

The lifecycle that is specified is consistent: one developing pass, one roll in a camera, scanners locked once scans exist, and in-stock expiry with a month that requires a year. The gaps above are the ones that show up in ordinary use — a wrong camera, a later print order, a deleted job, and dates or film details corrected after the fact.

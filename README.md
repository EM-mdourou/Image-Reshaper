# Image Reshaper — V8.10
## V8.10 upload hotfix
- Fixes a frontend initialization crash introduced by the Engine Details popover.
- Click-to-browse and drag/drop upload handlers now initialize normally.
- Engine Details wiring waits for DOM readiness and does not access the `$` helper before initialization.
- Adds a regression test that verifies uploader event wiring and initialization order.


## V8.10 changes

### User-required fields override compact-size priority
When the user explicitly asks to add/show an address, venue, CTA, or date/time, that field is promoted to **USER_REQUIRED**. Compact and tiny layout budgets may normally omit lower-priority fields, but an explicit user request now overrides that omission rule.

### Better modification failure reasons
Modification Results now distinguishes between common causes such as:
- source/state value missing
- compact priority suppression
- user-required field promoted successfully
- fit/collision/render-placement failure after promotion

This is intended to answer *why* a requested item did not appear, rather than only saying that final PNG verification failed.

### Engine details are minimized
The permanent Engine Diagnostics block is replaced by a compact **ⓘ Engine details** control. Hover on desktop or click/tap to open the diagnostics popover.

### Full-width readable progress
Generate, Resize, Re-generate, Apply Text Changes, and Modify now use full-width progress panels with normal-size text, a larger progress bar, elapsed timer, current-stage description, and detailed action/size-specific stages.
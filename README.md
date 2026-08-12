# Image Reshaper — V8.8

## V8.8 fixes

- Adds a **Rejected candidate preview** link/modal when current-design QA rejects a modification. The rejected image is not saved as the current version, but the user can inspect what the model attempted.
- Replaces user-facing `IMAGE 1` / `IMAGE 2` wording with **current design** / **candidate modification**.
- Fixes the modify-plan merge order so newly returned backend crop/scale/position changes are not overwritten by the older browser state.
- Removes the server-side lock-copy behavior that could restore an old subject crop after the newest instruction requested a different crop.
- Adds a true **headshot** crop mode for requests such as “zoom into the person’s face” or “make the head the height of the banner”.
- Headshot mode uses the reusable original source subject asset where available, crops much tighter than upper-body mode, and allows a larger subject zone.
- `zoom into` is explicitly recognized by both the browser structured-state parser and backend instruction parser.

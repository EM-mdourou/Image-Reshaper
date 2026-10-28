Image Reshaper V8.18

Small normal-format destinations now generate on a larger same-ratio canvas that satisfies the current image-model minimum pixel budget, then resize proportionally without cropping. Extreme/tiny formats retain the exact-canvas content-priority renderer.

# Image Reshaper V8.18

V8.18 removes the normal large-format crop/blur workaround when the current GPT image models can generate at the requested aspect ratio. Articles, Events, and Front Page now request 1600x800 directly. Other supported non-exact formats use a same-ratio model canvas and are proportionally resized without cropping. Generate/Resize also runs visual QA on the actual final exported PNG.

Image Reshaper V8.18

V8.18 changes large landscape outputs to edge-to-edge safe cropping. Articles, Events, Front Page, and other suitable large landscape targets use the centered safe crop from the generated image; blur/contain remains a fallback for incompatible shapes. Extreme banners retain their specialized exact-canvas path.


Model migration: removes runtime use of retired gpt-image-1, defaults precise editing/generation to gpt-image-2.5-sunburst, falls back to gpt-image-2.5-flare, and maps a stale IMAGE_MODEL=gpt-image-1 environment setting to the supported primary model.

Image Reshaper V8.14

Preset update: Articles, Events, and Front Page now default to 1600 × 800 px, with a displayed minimum recommendation of 1200 × 600 px. The former News preset is renamed Articles.

Image Reshaper V8.12

Added manual "Crop to size" workflow with a client-side crop editor, exact-dimension PNG export, and CROP history logging.

# Image Reshaper — V8.11
## V8.11 upload hotfix
- Fixes a frontend initialization crash introduced by the Engine Details popover.
- Click-to-browse and drag/drop upload handlers now initialize normally.
- Engine Details wiring waits for DOM readiness and does not access the `$` helper before initialization.
- Adds a regression test that verifies uploader event wiring and initialization order.


## V8.11 changes

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
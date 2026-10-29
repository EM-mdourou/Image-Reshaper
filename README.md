# Image Reshaper V9.6

V9.6 fixes two Interactive Extreme issues found during live testing. **Remove** now actually deletes the selected layer from the layer stack instead of merely hiding it; Undo can restore a removed layer. Manual source extraction now records the exact pixel dimensions of each Exact/Cleaned/Transparent candidate and resizes the inserted Logo, QR, or Primary Visual layer to that asset's real aspect ratio, preventing wide shallow selections from inheriting an unrelated tall bounding box. Extraction previews also show the true pixel dimensions and no longer force a misleading fixed-height preview area.

V9.6 fixes Interactive control event wiring so controls that need both history-checkpoint and live-update listeners work correctly. Gradient edge, colour, and sheer strength now update the selected overlay immediately and export with the same values. V9.6 retains multi-step Undo/Redo to Interactive Extreme, repeatable AI background generation with selectable negative-space regions (Auto/Left/Right/Center/Top/Bottom), and movable/resizable gradient overlay layers for white or colored sheer contrast behind text and imagery. Gradient overlays support edge direction and opacity and are included in exact PNG export.

# Image Reshaper V9.2

V9.2 upgrades Interactive Extreme source selection into a reusable asset-extraction workflow. Every manual source selection keeps an exact crop and can also produce a cleaned/trimmed asset or a transparent cutout candidate using the original source pixels. Logo and QR corrections can be previewed before insertion, while QR cleanup preserves the QR artwork instead of regenerating it.

# Image Reshaper V9.1

V9.1 upgrades Interactive Extreme with direct inline text editing, font family/size/weight/alignment controls, unrestricted off-canvas visual transforms, numeric position/size controls, and manual source-pixel replacement for Logo, QR, and Primary Visual. Visual layers can intentionally exceed the final ad canvas and are clipped only by the export viewport. Logo/QR auto-crop prompts are stricter, with manual source selection as the authoritative fallback.

# Image Reshaper V9.0

V9.0 fixes extreme-format metadata leakage and QA priority mismatches. Analysis labels such as “Logos/brand marks:” are blocked from drawable copy, while MICRO/EXTREME/COMPACT final QA validates only the fields selected by the display budget plus explicit user-required fields. Actual logo/brand assets remain visual elements.

Image Reshaper V9.0

Small normal-format destinations now generate on a larger same-ratio canvas that satisfies the current image-model minimum pixel budget, then resize proportionally without cropping. Extreme/tiny formats retain the exact-canvas content-priority renderer.

# Image Reshaper V9.0

V9.0 removes the normal large-format crop/blur workaround when the current GPT image models can generate at the requested aspect ratio. Articles, Events, and Front Page now request 1600x800 directly. Other supported non-exact formats use a same-ratio model canvas and are proportionally resized without cropping. Generate/Resize also runs visual QA on the actual final exported PNG.

Image Reshaper V9.0

V9.0 changes large landscape outputs to edge-to-edge safe cropping. Articles, Events, Front Page, and other suitable large landscape targets use the centered safe crop from the generated image; blur/contain remains a fallback for incompatible shapes. Extreme banners retain their specialized exact-canvas path.


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

## V9.0 Interactive Extreme Beta
Extreme/compact formats can now switch between Classic and Interactive Beta. Interactive Beta exposes separate background, logo, primary visual, headline/detail/CTA/supporting layers; supports drag/resize/hide/remove; drag/drop priority; source-derived palette controls; two background candidates; and final exact-PNG QA. Classic remains available for A/B comparison.

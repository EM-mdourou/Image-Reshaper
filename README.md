# Image Reshaper — V8.2

V8.2 keeps the V8 unified source-analysis model, but adds a **fit-budget layer** so very small canvases no longer try to draw every field at full visual priority, and it removes the V8.1 large-format foreground cropping behavior.

## What changed in V8.2

### 1. Tiny canvases now budget content before rendering
For destinations such as:
- Mobile Directory — 200×100
- Desktop Directory — 320×100
- Mobile Ad — 320×50

all extracted facts remain preserved in the design state and editable fields, but the renderer decides which ones can be shown legibly on the current canvas.

For a tiny canvas the default drawing priority is:
1. headline / event identity
2. one key date/time fact
3. a real CTA when one exists
4. recognizable source subject(s)
5. venue/address only when there is room

Lower-priority venue/address/extra copy is **not deleted from state** simply because it is omitted from the tiny drawing.

### 2. Hard no-overlap regions for tiny layouts
V8.2 uses a dedicated tiny-canvas geometry planner with separate rectangles for:
- subject/people
- headline/key copy
- CTA

These regions are calculated before text is drawn. The CTA is not painted on top of the headline or subject.

### 3. CTA is atomic and contrast-safe
If a verified source CTA is present, the fit budget reserves a visible CTA region before typography is laid out.

A CTA button now behaves as one element:
- button background
- button text

The CTA text color is selected for contrast against the CTA background. A dark/black button therefore receives light text instead of an empty-looking black rectangle.

For ultra-shallow 320×50 output, CTA may render as compact inline action text rather than a large pill/button when that is the only collision-free representation.

### 4. Large-format foreground is no longer cropped
V8.1 used a target-aspect safe crop for AI-generated larger formats. That could cut off top logos or bottom CTA/info strips.

V8.2 changes normal landscape/square/portrait/tall finalization to **safe contain**:
- the complete generated foreground is kept visible;
- only decorative edge fill may be extended/cropped;
- the actual composition is proportionally contained inside the requested destination canvas.

This is used for formats such as Events 880×460, News, Front Page, square/social, Side Ad and Large Ad.

### 5. One canonical source analysis is still shared across all sizes
This release does **not** restore the old split source-analysis architecture.

All destinations still share the same canonical manifest for:
- people
- logos
- background artwork
- headline
- date/time
- venue/address
- CTA
- prices/additional facts

The destination size changes the **display budget and geometry**, not what the system believes exists in the original artwork.

### 6. Re-generate does not re-analyze the source when cached analysis exists
When `priorPlan.sourceManifest` is available, `REGENERATE`, `MODIFY`, `EDIT_TEXT`, and `REPLAN` reuse that cached manifest instead of running source analysis again.

The longer time for larger AI-generated formats can therefore come from image generation, preservation QA, final-image QA, and an automatic retry—not necessarily source re-analysis.

## Operation modes

### Apply text changes — `EDIT_TEXT`
- current design remains the baseline;
- updates authoritative text/content;
- compact/tiny canvases re-render deterministically from current state;
- larger AI formats use current-design patch mode with preservation QA.

### Modify current design — `MODIFY`
- current design remains the baseline;
- only requested state/layout properties should change;
- unrelated content should remain unchanged.

### Re-generate — `REGENERATE`
- deliberately creates a different layout;
- reuses the canonical source manifest when available;
- remains the only mode intended to create a new composition.

## Text color
- explicit user color instructions are authoritative;
- source/theme colors are preferred when available;
- neutral black remains the fallback when no reliable source color is available;
- no lime-green fallback is introduced by the renderer.

## Authentication
The existing database-backed authentication remains unchanged.

Required deployment variables:
- `DATABASE_URL` or `POSTGRES_URL`
- `SESSION_SECRET`
- `OPENAI_API_KEY`

## Rollback
The legacy V7 exact/compact path remains available for emergency comparison:

```text
RENDER_ENGINE=legacy
```

Default:

```text
RENDER_ENGINE=unified
```

## Automated tests

Run:

```bash
npm test
```

V8.2 tests cover:
- routing for all current destination presets;
- 728×90, 320×100, 200×100 and 320×50 exact-canvas behavior;
- 880×460 and other larger formats using non-cropping safe-contain finalization;
- content budgets for tiny/compact/full canvases;
- CTA priority and no-overlap policy;
- mathematical separation of subject, copy and CTA rectangles on tiny canvases;
- explicit text-color state changes;
- mocked `GENERATE`, `EDIT_TEXT`, `MODIFY`, and `REGENERATE` API behavior;
- frontend/backend version consistency.

See `tests/TEST_REPORT.md` for the pre-package report.

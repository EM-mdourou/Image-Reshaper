# Image Reshaper — V8.1

V8.1 keeps the V8 unified source-analysis architecture, but separates **operation behavior** from **canvas/layout behavior** so compact banners no longer behave like shrunk posters and normal Modify/Edit operations no longer behave like Regenerate.

## Operation modes

### Apply text changes — `EDIT_TEXT`
- Uses the **current rendered PNG** as the visual baseline.
- Changes authoritative text/content only.
- Allows only minimal local text reflow needed for legibility.
- Does not intentionally create a new composition.
- For non-compact formats, the candidate is visually compared with the current design. If the first result drifts into a redesign, V8.1 retries with a stricter patch prompt. If the second attempt still changes the overall composition, the request is rejected instead of silently saving a redesign.

### Modify current design — `MODIFY`
- Uses the **current rendered PNG** as the baseline.
- Applies only the newest requested change.
- Preserves all unrelated people, logos, background regions, major text groups, margins and hierarchy.
- If the user says “from version X” / “revert to version X”, that saved version is used as the actual visual baseline.
- Large/non-compact results receive the same preservation QA described above.

### Re-generate — `REGENERATE`
- Uses the canonical original source manifest to create a **new composition**.
- Does not inherit prior manual text edits as authoritative regenerated copy.
- The previous current design is supplied only as a comparison reference so a non-compact regenerated result can be checked for meaningful layout difference.

## One source model, dimension-aware rendering

V8.1 does **not** restore separate source-analysis systems.

All sizes still use the same canonical source manifest and the same normalized text/person/logo/background model. The destination dimensions only select the safest final rendering strategy.

### Exact-canvas profiles
Very shallow horizontal destinations use the deterministic exact-dimension canvas compositor so a normal poster is never shrunk into the middle of a banner with blurred/empty sides.

Examples routed to exact-canvas rendering:
- Mobile Ad — 320×50
- Leaderboard Ad — 728×90
- Mobile Directory — 200×100
- Desktop Directory — 320×100

### AI safe-crop profiles
Normal landscape, square, portrait and tall formats use the unified AI composition path. The model works on its supported generation canvas, but V8.1 returns the mathematically correct target-safe crop and the browser exports exactly that region instead of using blurred letterboxing.

Examples:
- Events — 880×460
- News — 850×638
- Opportunities — 850×350
- Action Alerts — 850×500
- Social Media — 1080×1350
- Front Page — 900×500
- Large Ad — 300×600
- Side Ad — 300×250

## Text colour behavior
- Explicit user colour instructions are stored deterministically in text style state for exact-canvas designs.
- Source text/theme colours are preferred when available.
- **Neutral black is the fallback** if no reliable source colour is available.
- V8.1 no longer invents a lime-green fallback.

## Exact final dimensions
For AI-composed formats, the backend sends `safeCrop` coordinates corresponding to the requested aspect ratio. The browser crops that exact region to the requested destination size. This replaces the old contain/blur-letterbox behavior.

## Canonical source consistency
Compact and large formats continue to share:
- people/person source elements
- logos
- background artwork
- headline
- date/time
- venue/address
- CTA
- prices/additional text

`MANIFEST_*`, `BANNER_*`, `NONE`, parser metadata and quoted wrapper values are filtered before editable fields are displayed.

## Authentication
The database-backed login system from V7.35+ is retained. Password verification is server-side and passwords are stored as salted scrypt hashes.

Required Vercel variables:
- `DATABASE_URL` or `POSTGRES_URL`
- `SESSION_SECRET`
- `OPENAI_API_KEY`

## Rollback
The legacy V7 exact/compact renderer code remains available for emergency comparison with:

```text
RENDER_ENGINE=legacy
```

The default remains:

```text
RENDER_ENGINE=unified
```

## Tests run for V8.1

Run:

```bash
npm test
```

The included tests verify:
- destination/profile routing for 728×90, 320×100, 200×100, 320×50, 880×460, 300×250, square and portrait dimensions;
- the full preset routing matrix;
- exact-canvas routing for compact horizontal formats;
- safe-crop aspect-ratio math for non-compact formats;
- strict current-design patch architecture;
- frontend safe-crop finalization;
- mocked `/api/reshape` behavior for `EDIT_TEXT`, `MODIFY`, and `REGENERATE` at compact and Events-size destinations;
- version/footer consistency.

A detailed pre-package report is included at `tests/TEST_REPORT.md`.

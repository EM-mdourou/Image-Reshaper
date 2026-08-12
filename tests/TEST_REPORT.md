# V8.2 Pre-package Test Report

## Scope
V8.2 was tested locally before packaging. OpenAI network calls were mocked because the local packaging environment does not use the deployed project's API credentials. Routing, state, multipart handler behavior, sizing rules, geometry, and syntax were tested with real project code.

## Test matrix

### Destination routing
Verified:
- Leaderboard Ad — 728×90 → exact canvas
- Desktop Directory — 320×100 → exact canvas
- Mobile Directory — 200×100 → exact canvas
- Mobile Ad — 320×50 → exact canvas
- Events — 880×460 → AI safe-contain
- News — 850×638 → AI safe-contain
- Opportunities — 850×350 → AI safe-contain
- Action Alerts — 850×500 → AI safe-contain
- Front Page — 900×500 → AI safe-contain
- Side Ad — 300×250 → AI safe-contain
- Large Ad — 300×600 → AI safe-contain
- Social Media — 1080×1350 → AI safe-contain
- square/portrait test dimensions → AI safe-contain

### Tiny fit-budget behavior
Verified that 200×100 with headline/date/venue/address/CTA:
- keeps headline;
- keeps date/time;
- keeps CTA;
- omits venue/address from the DRAWING budget rather than forcing collisions;
- preserves `noOverlap=true`.

Verified that 320×50 uses compact inline CTA mode.

Verified that 728×90 keeps CTA and can keep venue while dropping address from the drawing budget.

### No-overlap geometry
For 200×100, 320×100 and 320×50, calculated geometry was checked to confirm:
- subject rectangle does not intersect copy rectangle;
- subject rectangle does not intersect CTA rectangle;
- copy rectangle does not intersect CTA rectangle;
- all regions have positive dimensions.

### CTA behavior
Static architecture checks confirm:
- dedicated CTA reservation exists;
- CTA text uses contrast calculation against the CTA background;
- tiny layouts use the dedicated fit-safe renderer.

### Large-format preservation
Static/routing tests confirm AI-sized outputs now return `exportMode: safe-contain` and frontend finalization uses `containDesignWithDecorativeFill`, so the complete generated foreground is drawn without top/bottom cropping.

### Operation modes
Mocked handler tests cover:
- initial generation;
- Apply Text (`EDIT_TEXT`);
- Modify current design;
- Re-generate;
- compact exact-canvas and Events-size AI paths.

### Source-analysis reuse
The handler code path reuses `priorPlan.sourceManifest` for `regenerate`, `replan`, `edit_text`, and `modify`. This prevents repeat source analysis when cached canonical analysis is available.

## Commands run

```text
npm test
node --check api/reshape.js
node --check api/health.js
node --check middleware.js
node --check lib/auth.js
node --check lib/db.js
frontend inline JavaScript syntax check
```

## Limitation
The final visual quality of OpenAI-generated large-format compositions cannot be fully validated offline without making the deployed OpenAI API calls. The project therefore retains final-image QA/retry behavior at runtime. The deterministic tiny/exact-canvas geometry and CTA fit logic were tested locally.

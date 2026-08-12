# V8.5 Test Report

## Automated checks

All automated tests passed locally before packaging.

### Routing / canvas profiles
Verified destination profiles and render strategies for:
- 728×90 Leaderboard
- 320×100 Desktop Directory
- 200×100 Mobile Directory
- 320×50 Mobile Ad
- 880×460 Events
- 300×250 Side Ad
- 1080×1080 square
- 1080×1350 portrait

`RESIZE` is treated as a new target-layout operation, while `MODIFY` and `EDIT_TEXT` remain current-design operations.

### Source-manifest reuse
Mocked handler tests verify that when a cached `sourceManifest` is supplied:
- compact RESIZE does not rerun source fact analysis;
- large-format RESIZE does not rerun source fact analysis;
- REGENERATE / MODIFY / EDIT_TEXT also reuse the cached manifest.

### Background behavior
Static architecture tests verify:
- exact/shallow background generation receives a centered target-aspect safe-strip instruction;
- the prompt explicitly rejects isolated tower tips / partial landmark fragments;
- compact Regenerate produces a new target-aware background instead of reusing the same background forever.

### Engine diagnostics
Verified the UI includes a stable Source Manifest fingerprint plus:
- Analyzed / Reused state
- operation
- canvas profile
- renderer
- target dimensions

This allows the same uploaded source to be checked across multiple output sizes.

### Existing V8.2 regression checks retained
- no-overlap tiny geometry
- CTA contrast
- explicit text-color state
- large-format foreground-safe containment
- current-design preservation hooks
- syntax checks

## Limitation
OpenAI image/vision calls are mocked in the automated handler tests because the local packaging environment does not use the deployed project's API credentials. Routing, manifest reuse, prompt construction, state behavior and UI logic are tested; visual quality must still be verified on the deployed build with real model outputs.

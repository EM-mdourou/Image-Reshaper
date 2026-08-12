# V8.1 Test Report

Executed before packaging on 2026-08-12.

## Syntax checks
Passed:
- `index.html` inline JavaScript
- `api/reshape.js`
- `api/health.js`
- auth API routes
- `lib/auth.js`
- `lib/db.js`
- `middleware.js`

## Automated tests
Command:

```bash
npm test
```

Passed test suites:

### Routing/profile matrix
Verified exact-canvas routing for:
- 728×90 Leaderboard Ad
- 320×100 Desktop Directory
- 200×100 Mobile Directory
- 320×50 Mobile Ad

Verified unified AI safe-crop routing for:
- 880×460 Events
- 850×638 News
- 850×350 Opportunities
- 850×500 Action Alerts
- 1080×1350 Social Media
- 900×500 Front Page
- 300×600 Large Ad
- 300×250 Side Ad
- 1080×1080 square custom size

### Safe-crop math
Verified that non-compact AI generation safe-crop aspect ratios match the requested destination aspect ratio.

### Mocked `/api/reshape` handler tests
Using mocked OpenAI responses/image-edit calls, verified:
- initial Generate for 728×90, 320×100, 200×100, and 320×50 returns the exact-canvas composer;
- EDIT_TEXT for those compact sizes returns the exact-canvas composer and reuses current assets;
- MODIFY for 728×90 uses the exact-canvas current-state patch path;
- REGENERATE for 728×90 uses the exact-canvas new-layout path and resets prior user text locking;
- Generate, EDIT_TEXT, MODIFY, and REGENERATE for 880×460 use the unified AI safe-crop path;
- 880×460 responses contain a mathematically correct `safeCrop` rather than contain/blur-letterbox export mode.

### Frontend state tests
Verified:
- repeated “move further right” requests increment from the CURRENT subject position instead of resetting to the original position;
- explicit “change heading colour to black” stores `#000000` in authoritative style state;
- explicit “change text colour to white” updates all text roles;
- black is the neutral fallback when source text colour is unavailable.

### Static architecture checks
Verified:
- compact horizontal canvases route through exact-canvas rendering while retaining the same canonical source manifest;
- Modify/Edit use a dedicated CURRENT DESIGN PATCH prompt;
- structural preservation comparison exists for current-design patches;
- a patch that still looks like a redesign after two attempts is rejected rather than silently saved;
- Regenerate receives the current design as a comparison reference;
- frontend finalization uses safe-crop for AI-generated results;
- initial and Modify rendering use the same centralized finalization function;
- footer/application/backend package versions are V8.1.

## Live OpenAI limitation
The build environment used for packaging does not contain the deployment's `OPENAI_API_KEY`, so the tests intentionally mock external OpenAI API responses. The routing, state, multipart handler, safe-crop, preservation/retry, and frontend logic were exercised locally; a final live smoke test on the Vercel deployment is still recommended after deployment.

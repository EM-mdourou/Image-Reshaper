# V8.6 Test Report

## Added in V8.6
- Estimated API cost appears beside Reshape, Re-generate, Apply Text Changes, and Modify Current Design.
- Engine Diagnostics includes the estimate for the completed operation.
- Per-action inline progress panels include elapsed time, a progress track, and detailed action-specific stages.
- Progress stage lists differ for GENERATE, RESIZE, REGENERATE, EDIT_TEXT, and MODIFY, and also distinguish exact/compact canvases from standard canvases.
- Resize with a cached manifest begins with **Load cached source manifest**, making source reuse visible to the user.

## Automated checks
- Front-end JavaScript syntax: PASS
- Backend / auth / middleware JavaScript syntax: PASS
- Cost/progress UI contract test: PASS
- Routing/profile matrix: PASS
- Fit-budget tests: PASS
- Frontend state/color tests: PASS
- Static architecture tests: PASS
- Mocked handler operation tests: PASS

## Cost-estimate note
The UI intentionally displays estimates rather than exact billing. Current pricing assumptions are encoded for the model paths used by V8.6, while image-input tokens, GPT planner/vision token usage, automatic retries, and model fallback can vary per request.

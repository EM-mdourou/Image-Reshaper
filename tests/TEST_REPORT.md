# V8.7 Test Report

## Added in V8.7
- Structured design state v2 exists and is preserved in the plan.
- Text elements carry persistent geometry/style metadata.
- Text move/scale/color instructions patch structured state before rendering.
- Subject scale requests prefer the original reusable source subject asset.
- Grouped multi-person subject assets are recognized as scalable as a group.
- Standard-size current-design image edits receive the original uploaded source as a reference image.
- Deterministic structured patches do not automatically pay for a second full image edit when the first preservation QA fails.
- Exact-canvas renderers read structured text geometry for persistent positional/style changes.

## Regression coverage
The existing routing, tiny fit-budget/no-overlap, manifest reuse, mocked handler operation, cost/progress UI, and syntax tests are run together with the V8.7 structured-state test before packaging.

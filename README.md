# Image Reshaper — V8.6

## V8.6 goals

### Structured current-design state (not just a flattened PNG)
V8.6 treats the current design as a structured editable state made of background, people/subjects, logos, text fields, and layout metadata. **Apply text changes** and **Modify current design** are intended to patch that current state instead of restarting from the original source or treating the latest render as the only truth.

### Source-geometry / source-asset reuse for subject scaling
When a person/subject needs to be moved, enlarged, or reframed, V8.6 prefers the best available reusable source asset and stored geometry from the canonical source manifest. The goal is to scale or reposition the original extracted subject instead of enlarging a tiny already-rendered thumbnail whenever the source library supports it.

### Geometry-aware diagnostics
The UI now surfaces extra engine diagnostics so you can verify the unified system more easily:
- whether the source analysis was **Analyzed** or **Reused**
- the **Source Manifest ID**
- the operation and target
- the renderer and canvas profile
- whether the **Current design state** is structured
- whether **Source geometry** is available for reuse

### Unified system across all destination sizes
All destination sizes continue to use one shared source-manifest pipeline. Changing size with the same uploaded source should reuse the canonical manifest and start from layout planning / rendering for the new dimensions rather than re-reading the source facts every time.

### Safer modify/edit prompts
Current-design patch modes now include stronger guidance to preserve the current layout, treat the current design state as the baseline, and use reusable source subject assets for resize / move requests whenever available.


### V8.6 interface updates
- Generic Optional Instructions examples rather than poster-specific examples.
- When at least one older version exists, the Previous versions area also shows a highlighted **Current version X** card for direct comparison.
- Apply Text Changes and Modify Current Design display an elapsed timer while running.
- Header account display shows the username once (role duplication removed).
- Added a compact Image Reshaper icon beside the application title.


## V8.6 cost visibility and progress UX

- Every action now shows an **estimated API cost before click**, based on the current renderer/profile and current OpenAI list-price assumptions used by this build.
- Engine Diagnostics repeats the estimate for the completed operation. This is intentionally labeled an estimate because image-input token usage, planner/vision token usage, model fallback, and QA retries vary.
- Generate/Resize, Re-generate, Apply Text Changes, and Modify Current Design each get their **own inline progress panel and elapsed timer directly below the action button**.
- Progress stage names differ by operation and by exact/compact vs standard canvas. Resize from the same uploaded source explicitly starts with **Load cached source manifest** rather than pretending to re-analyze the source.

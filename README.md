# Image Reshaper — V8.3

## V8.3 goals

### Analyze a source once, then reuse the canonical manifest
When the same uploaded artwork is reshaped into a different destination size, the browser now sends `mode=resize` with the cached `sourceManifest`. The backend skips source fact extraction and starts from layout planning for the new dimensions. Uploading a new source image still starts a fresh analysis.

### Engine diagnostics
The result now displays a Source Manifest ID, whether source analysis was **Analyzed** or **Reused**, the operation, canvas profile, renderer, and target dimensions. The same uploaded source should retain the same Manifest ID across Events, Leaderboard, Mobile Directory, etc.

### Better extreme-format backgrounds
Exact-canvas backgrounds are now generated with a target-aspect safe strip. The background generator is explicitly told to create a panoramic/source-inspired scene across that strip and not leave isolated tower tips, partial landmarks, or accidental-looking fragments.

### Regenerate on exact banners
Re-generate still reuses the canonical source manifest, but it now creates a fresh target-aware background asset for the new banner layout rather than reusing the same cropped background forever. It does not rerun source fact analysis.

### Unified architecture
All sizes share the same canonical source manifest and semantic source-element model. Dimension profiles affect layout/render constraints only. Exact/shallow canvases use the exact-canvas renderer; larger formats use the unified AI-safe renderer.

# Image Reshaper — Version 8.0

## Unified engine architecture

Version 8.0 removes the hard runtime distinction between large formats and banner formats. Every destination size now goes through the same source-analysis and image-composition pipeline. The target width, height and aspect ratio are layout constraints only.

### One canonical source manifest
The original upload is analyzed into one shared manifest containing headline/date/venue/address/CTA/prices/people/logos/background information. Events, square/tall formats, leaderboard ads, directory ads and custom sizes all consume the same manifest.

### Three explicit operation modes
- **Apply text changes (EDIT_TEXT):** current rendered design is the visual baseline. Only text/content and necessary local reflow should change.
- **Modify current design (MODIFY):** current rendered design is the visual baseline. Only the requested elements should change.
- **Re-generate (REGENERATE):** creates a deliberately different composition from the original canonical source state. It does not use the current layout as the design baseline. Text fields are rebuilt from the regenerated source/design state.

These rules apply identically to every destination size.

### Legacy rollback
The V7 compact/banner composer code remains in the backend as a rollback path. Set the Vercel environment variable `RENDER_ENGINE=legacy` to activate it temporarily. With no variable (or `RENDER_ENGINE=unified`), Version 8.0 uses the unified engine. V7.36 remains the full rollback ZIP.

### Text color fallback
The old lime-green fallback has been removed from the unified path. Source-derived colors are preferred; when a reliable color cannot be determined, the fallback is black rather than invented green.

### Logos and facts
Canonical facts and logos remain protected. Modify/Edit Text are preservation operations. Regenerate may change composition but should preserve source facts and immutable logos.

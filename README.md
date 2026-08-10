# Muslim Link Image Reshaper — V7.29

## V7.29 — User-authoritative layout + final-image verification

### User instructions are the highest authority
User-added text and explicit user instructions are mandatory. The renderer may reorganize the composition, reduce spacing, move other content, or use another open region of the banner, but it may not silently drop user-requested content.

### Free-placement user text
User-added text no longer gets merged into the normal “extra facts” column. It is composited as an independent required element after the base banner is rendered, and may use left, right, center, upper, or lower open regions.

### Theme-aware font styling
New text inherits source/planner font-family hints, CTA/headline styling and the source accent palette where possible. Generic black is no longer the preferred fallback for manually added banner text.

### Actual final-image validation
After Apply text changes and Modify current design, V7.29 sends the actual rendered PNG to a vision validation pass. “Applied” is shown only when the visible end product verifies the request.

### Descriptive version history
Direct text/content versions now describe the actual change, such as “Added text: Ayesha Shirazi” or “CTA changed from … to …”.

### Editable fields for large formats
Non-banner results now return a structured bannerPlan/source text manifest as well as the flattened image, allowing large poster/social sizes to populate the same Edit text & content system used by compact banners.

### Retained V7.28 features
- Source elements
- Modification diagnostics
- Version-targeted branching
- Persistent visual subject controls
- Stable manual fields

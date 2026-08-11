# Image Reshaper — V7.32

## V7.32 changes

### Added text now uses layout planning
- User-added text is no longer painted afterward as a floating overlay.
- Added text is now treated as planned content and routed through the regular composition/layout path.
- This reduces awkward placement, overlap, blur, and detached grey/green chips.

### Better text-field cleanup
- Meta/prose strings such as style-analysis notes are filtered out of editable text fields.
- Large-format text fields now avoid values like typography descriptions or placeholder phrases.
- Venue/address/headline/date/CTA fields are scrubbed when the detected value looks like analysis metadata instead of real source text.

### Better source-element consistency
- Text roles are normalized more consistently across larger and banner sizes.
- Person/price/text role detection is stricter.
- Reusable text rows shown in Source elements are filtered to remove analysis-only noise.

### Theme-aware text color
- Compact/banner rendering now prefers source/theme-derived colors instead of defaulting to black.
- Headline, CTA, supporting text, and manual/added text all resolve through the shared theme color logic.

### Notes
- Logos are still intended to remain source-faithful.
- Final-image validation remains based on the actual rendered PNG, not only internal state.

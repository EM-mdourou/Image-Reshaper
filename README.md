# Muslim Link Image Reshaper — V7.30

## V7.30 — Shared semantic elements + canvas-level theme styling

Large formats and compact banners now use the same semantic element model.

- Portrait/photo descriptions are converted to Person elements instead of editable text.
- Parser/meta labels such as `Venue name + address (linked fact group)` are discarded.
- Prices are exposed as price text fields.
- Venue/address/date/CTA are normalized into their own editable fields when values are available.
- Visual-analysis prose is filtered out of editable content.

Canvas-rendered text now uses theme/style metadata in the PNG renderer itself rather than relying on CSS. Added and banner text can inherit source accent colors, font-family hints, weight, and role-specific styling instead of defaulting to black.

Retains V7.29 user-authoritative text, free placement, final-PNG validation, descriptive version history, version branching, source elements, and modification diagnostics.

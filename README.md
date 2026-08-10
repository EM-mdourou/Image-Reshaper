# Muslim Link Image Reshaper — V7.20

V7.20 fixes the non-responsive Step 1 / Step 2 / Step 3 controls.

## Root cause
The V7.19 frontend script had two JavaScript parse-stopping redeclarations:

1. `wrapTextLines` / `fitWrappedHeadline` were declared twice at top level.
2. `const target` was declared twice inside the same Modify request block.

Because the browser could not parse the application script, native textareas still worked but all JavaScript-powered controls appeared dead: upload, drag/drop, destination selection, custom dimensions, and action buttons.

## V7.20 fixes
- removes the duplicate text-layout helper declarations
- removes the duplicate `target` declaration
- validates the complete frontend script as classic JavaScript before packaging
- keeps the V7.18 uploader wiring
- keeps all V7.19 destination presets
- explicitly wires custom dimensions

All backend/history/text-priority/modify-current-design behavior from V7.19 is retained.


## V7.21 — Authoritative Modify Instructions

- Explicit user text instructions now have deterministic priority over extracted copy.
- Supports natural phrases such as “add the subheading X after the heading Y”.
- “Missing/complete to the end” instructions append the requested phrase to the current protected headline.
- Speaker-name instructions can remove the detached box and integrate names into the artwork.
- Existing iterative version history and current-design modification workflow are preserved.

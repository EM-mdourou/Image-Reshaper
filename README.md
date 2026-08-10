# Muslim Link Image Reshaper — V7.21

V7.21 makes **Modify Instructions authoritative**, especially for text changes, while retaining the frontend reliability fixes introduced in V7.20.

## V7.21 — Authoritative Modify Instructions
- Explicit user text instructions have deterministic priority over extracted/source copy.
- Supports natural phrases such as “add the subheading X after the heading Y”.
- “Missing/complete to the end” instructions append the requested phrase to the current protected headline.
- Speaker-name instructions can remove a detached name box and integrate names into the artwork.
- Existing iterative version history and current-design modification workflow are preserved.

## Retained from V7.20 — Frontend Reliability
V7.20 fixed the non-responsive Step 1 / Step 2 / Step 3 controls caused by JavaScript parse-stopping redeclarations.

Retained fixes include:
- removal of duplicate text-layout helper declarations
- removal of the duplicate `target` declaration
- complete frontend-script validation before packaging
- V7.18 uploader wiring
- all V7.19 destination presets
- explicitly wired custom dimensions

All backend, history, text-priority, and modify-current-design behavior from the preceding versions remains included unless superseded by the V7.21 instruction-priority behavior above.

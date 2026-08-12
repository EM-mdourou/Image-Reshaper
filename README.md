# Image Reshaper — V7.36

## State modes are now explicit across all sizes

- **EDIT_TEXT** (Apply text changes): uses the current rendered version as the visual baseline, changes authoritative text/content only, and allows only local text reflow when needed.
- **MODIFY** (Modify current design): uses the current rendered version as the visual baseline and patches only the newest requested change. If a prior version is referenced, that version's rendered image is used as the baseline.
- **REGENERATE**: intentionally creates a new layout from the canonical original source manifest. Prior text edits/manual fields are not silently carried forward; editable fields are rebuilt to match the regenerated design/source state.

## Manifest cleanup

Internal parser/control values such as `MANIFEST_LOCATION: NONE`, `MANIFEST_*`, `BANNER_*`, and literal `NONE` are filtered before editable fields are created. For virtual events with no address, the Address / location field is omitted.

## Large vs compact behavior

The same state-mode rules now apply to both large formats and compact/banner formats. Large-format EDIT_TEXT and MODIFY use the current rendered image instead of restarting from the original artwork.

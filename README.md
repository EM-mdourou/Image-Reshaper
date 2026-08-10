# Muslim Link Image Reshaper — V7.27

## V7.27 — Universal design state, instant text edits, style inheritance, and version branching

### One structured design state for every size
V7.27 normalizes every result into a universal `designState` / `bannerPlan` before it reaches the editor.

This means the text editor no longer depends on the extreme-banner renderer. Large poster/social formats and compact banners use the same text-element model whenever text was extracted.

If no text was extracted, **+ Add text** still works and is rendered immediately.

### Instant Apply text changes
**Apply text changes** is now a local design-state operation.

The flow is:
1. update the current text element state;
2. render the current design locally;
3. save a new version;
4. do not wait for or require a new AI generation.

This makes newly added text appear immediately on the current version.

### Font/color/style inheritance
Each text element now carries style metadata:
- font family hint
- font weight
- color
- alignment
- role

When exact style information is unavailable, V7.27 preserves planner/user style hints and uses role-based fallbacks instead of always forcing one generic black style.

Newly added text inherits from recent extra/CTA/headline styling where possible.

### Version-targeted branching
Modify instructions may reference an earlier version:

- “revert to version 6 and add ...”
- “from version 6, move the picture ...”
- “use version 4 and make the headline larger”

The referenced version becomes the base state for the new change. Later versions remain in history; the tool creates a new branch/version from the requested base.

### Diagnostics
When a version reference is used, the Modification Results panel reports which version was selected as the base.

### Retained V7.26 behavior
- Source elements panel
- Applied / Partial / Could not apply diagnostics
- Literal subject sizing
- Stable text fields
- Persistent subject state
- Large-format added-text compositor

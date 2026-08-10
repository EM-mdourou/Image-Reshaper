# Muslim Link Image Reshaper — V7.25

## V7.25 — Literal subject sizing + large-format added text

### Extreme-banner subject sizing
User sizing language now maps to explicit canvas-height targets instead of one fixed 1.22 scale value.

Examples:
- “bigger” → at least ~86% of banner height
- “much bigger/larger” → at least ~94%
- “occupy the entire/full height” → ~98%
- “zoom in / head and shoulders / make faces clearer” → tight upper-body crop + ~94%

Repeated “make it bigger” instructions continue increasing the target instead of producing the same result.

When the user explicitly requests a large subject, that request can override the old narrow subject-width zone. Text and background must adapt rather than forcing portraits back to thumbnail size.

Transparent margins are trimmed before hybrid-banner scaling.

### More reliable two-person swapping
Instructions such as:
- “switch the two speakers”
- “swap the two women”
- “switch the pictures of the 2 women”

now infer `subjectCount = 2` even if source analysis forgot to provide it, allowing the renderer's deterministic two-subject swap behavior to activate.

### Large-format + Add text
Large AI-generated formats now have a deterministic added-text compositor.

If a large design has no editable extracted fields, **+ Add text** still works:
1. Add the new field.
2. Enter the text.
3. Click **Apply text changes**.
4. The exact text is composited onto the current large-format image in a readable overlay.

Added text is preserved when later large-format modifications are rendered.

### Retained V7.24 behavior
- Stable text fields with no duplication on Apply
- Structured center/left/right subject positioning
- Persistent subject state
- Dynamic Edit text & content panel
- Exact authoritative text editing
- Version history

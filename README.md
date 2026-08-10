# Muslim Link Image Reshaper — V7.26

## V7.26 — Source element library + modification diagnostics

### Source elements
After the first generation, the app builds a reusable library of elements identified from the original artwork.

The new **Source elements** panel groups what is available, including:
- People / speakers
- Logos
- Background artwork
- Text
- Other identified elements

Each item is labelled:
- **Reusable** — available as a reusable asset/reference
- **Grouped / partial** — detected but contained inside a combined asset
- **Reference only** — detected but not isolated cleanly

The source-element library is intended to support later instructions such as:
- add / restore an element from the original artwork
- move an element
- make an element larger
- remove an element
- swap two people
- bring back a logo or featured person

### Modification results
Every Modify run now shows a **Modification results** panel with:
- Applied
- Partial
- Could not apply

Examples:
- Applied: subject position was updated and locked.
- Partial: requested person is part of a grouped subject image and cannot yet be inserted independently.
- Could not apply: no matching reusable element was identified in the original artwork.

The diagnostic messages are based on actual element/state availability checks so the application no longer silently ignores unsupported requests.

### Retained V7.25 behavior
- Literal subject-height controls
- Large-format added-text compositor
- Stable text fields with no duplication
- Dynamic Edit text & content
- Persistent subject state
- Version history

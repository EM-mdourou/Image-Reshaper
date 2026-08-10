# Muslim Link Image Reshaper — V7.24

## Structured visual-state controls

V7.24 applies the same state-based approach used for exact text to subject placement.

Natural-language visual instructions are converted into deterministic plan values before layout and are re-applied after the AI response so the renderer cannot quietly ignore them.

Supported examples include:
- “Place Sammy in the middle” → subject center = 50%.
- “Make Sammy bigger / more visible” → persistent subject scale increase.
- “Move the speakers to the right” → persistent right-side anchor.
- “Move the speakers to the left” → persistent left-side anchor.
- “Switch/swap the two speakers” → reverse visual order for a two-person subject asset.

For a two-person isolated/group asset, V7.24 can visibly reverse the two halves in the final renderer. Truly independent arbitrary person-by-person positioning still benefits from future source isolation returning separate assets for each subject.

## Text editor duplication fix

Manual text now has a single source of truth.

- Clicking **Apply text changes** repeatedly does not add more fields.
- Existing manual field IDs remain stable.
- Only **+ Add text** creates a new empty field.
- Manual text is merged into visible extra text only at render time and deduplicated.

## Persistent visual state

Subject position, scale and order persist into later versions until a new user instruction explicitly changes them.

## Retained V7.23 features

- Dynamic Edit text & content panel
- Exact authoritative text editing
- Add/remove text
- Complete headline preservation
- Version history
- Natural-language Modify workflow

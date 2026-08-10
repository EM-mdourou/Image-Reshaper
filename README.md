# Muslim Link Image Reshaper — V7.22

## V7.22 — structured modification state

This version changes Modify from a prompt-only workflow into a state-patch workflow.

### Fixed
- Fixed `emphasizeDates is not defined` in compact/leaderboard rendering.
- Newest Modify instruction is parsed into a structured patch before layout.
- Text changes are applied deterministically to the current design state, not left to the image model.
- Requests like `add the text "on the Ballot" so it's "Your Future on the Ballot"` merge the requested final phrase into the current protected headline.
- Explicit `change headline/title/name to "..."` requests replace the headline exactly.
- Speaker-name and date requests persist in current design state.
- `make dates bigger` or `make speaker names legible` can modify facts already added in an earlier version without asking to add them again.
- Speaker-name placement/style directives remain persistent.

### Priority model
1. Newest user Modify instruction
2. Current design state
3. Verified source facts
4. AI art/layout decisions

The AI may choose layout, wrapping, position, scale, and visual treatment, but it must not undo explicit user text changes.

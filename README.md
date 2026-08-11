# Image Reshaper — V7.31

## Re-plan + deterministic re-render

When text is added or materially changed, Apply text changes now re-plans the current composition around the authoritative text before rendering. The planner reuses cached analysis/current assets and may move or resize non-logo visual elements to make room.

### Added text
Added text is part of the layout reflow instead of being treated as a floating overlay. The generic grey pill/background is removed by default. A plate is used only when the source/current design explicitly requests one.

### Logos
Re-plan and Re-generate mark logos as immutable source assets. Logos must not be redrawn, recolored, restyled, distorted, merged, simplified or invented.

### Banner typography
A centralized Canvas text-style resolver now prefers source/theme colors and typography hints over hard-coded black values.

### Cached source analysis
Re-plan reuses the cached source manifest whenever available and does not restart source analysis.

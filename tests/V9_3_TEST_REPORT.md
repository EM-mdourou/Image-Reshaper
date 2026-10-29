# Image Reshaper V9.3 Test Report

## New V9.3 features verified
- Multi-step Interactive Extreme Undo and Redo controls exist and preserve forward/back history stacks.
- Interactive layer move/resize/edit operations create undo checkpoints.
- Background-only API mode reuses the cached source manifest instead of re-analyzing source facts.
- Generate New Background supports Auto, Left, Right, Center, Top, and Bottom negative-space preferences.
- Repeated background generation appends additional selectable background candidates.
- Gradient overlay can be added as an independent movable/resizable layer.
- Gradient supports Left, Right, Top, and Bottom fade directions, custom colour, and opacity.
- Gradient is included in exact PNG canvas export.
- Full legacy regression suite passes.

## Result
PASS — full npm test suite including `v93-history-background-gradient.test.mjs`.

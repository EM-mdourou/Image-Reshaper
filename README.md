# Image Reshaper — V8.7

## Structured Current Design State
V8.7 expands the structured-design work so the editable truth is the design state, while the PNG is the rendered result. The state tracks text, subject/group geometry, styles, visibility, source references, and layer metadata.

### Deterministic state patches first
Common Modify requests are translated into state changes before any rendering step:
- move text or subject left/right/up/down
- enlarge/reduce subjects
- change text color
- change text scale
- preserve current layout while patching only the requested element

Exact-canvas formats render these structured patches locally. Standard/large formats still require the image editor for visual pixels, but the current structured state and original source are supplied as authoritative references so the model is not asked to redesign from scratch.

### Original source reuse for subject scaling
When a person/group is too small in the current render, V8.7 marks scale requests to prefer the original reusable source subject geometry/asset. For AI patch modes, the original source artwork is supplied as a reference alongside the current design so the editor can recover the higher-quality subject rather than simply enlarging a tiny rendered thumbnail. For exact-canvas layouts, the cached high-quality subject asset is scaled directly.

### Grouped subjects
If two people were isolated together as one transparent subject asset, the group is now considered independently scalable **as a group**. The UI no longer reports that no scalable subject exists when a grouped source asset is available and the user is asking to enlarge/move both people together. Individual independent movement still requires individual source geometry/cutouts.

### Text geometry
Text elements now carry normalized geometry metadata (offset, scale, alignment). Exact-canvas rendering reads that geometry so instructions such as “move the address a bit left” can be represented as a persistent state patch instead of being forgotten on the next operation.

### Lower-cost retry policy
For deterministic structured patches, V8.7 does not automatically launch a second full image edit after preservation QA fails. It returns a precise failure instead. Creative/unstructured patches retain the stricter retry behavior. This avoids paying for a second full image generation when the requested property is already represented in structured state.

### Diagnostics
Engine Diagnostics continues to show source-manifest reuse, renderer, estimated cost, current structured state, and source geometry availability. Modification Results now distinguishes grouped scalable assets from reference-only elements.

# Muslim Link Image Reshaper — V7.28

## V7.28 — Runtime repair for all poster sizes

V7.28 fixes a regression introduced in V7.27.

### Fixed: `applyVisualInstructionToPlan is not defined`
V7.27 still called the visual-instruction state transformer during:
- initial generation;
- Modify requests;
- version branching;

but the function itself was accidentally removed while the universal design-state renderer was introduced.

That caused every poster size to fail immediately with:

`applyVisualInstructionToPlan is not defined`

V7.28 restores the function and keeps the V7.27 universal design-state features intact.

### Restored visual controls
The repaired transformer preserves:
- center / left / right subject positioning;
- bigger / much bigger / full-height subject sizing;
- tighter upper-body / face-focused crops;
- two-person swap/order requests;
- persistent visual state across later versions.

### Retained V7.27 features
- Universal design state for all sizes
- Instant local Apply text changes
- Text style metadata / inheritance
- Version-targeted branching such as “from version 6…”
- Source elements
- Modification diagnostics

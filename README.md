# Image Reshaper — V7.34

## V7.34

### Current-design modification preservation
- Follow-up Modify requests use the current rendered version as the visual baseline.
- Large-format Modify requests explicitly enter CURRENT-DESIGN-ONLY mode: do not restart from the source composition and do not redesign unrequested areas.
- The automatic full-image QA retry is disabled for Modify mode because a retry could unintentionally create another complete redesign.
- Explicit requests such as “from version 3…” now attach that version’s rendered image as the actual edit baseline.

### Incremental element movement
- “move further right”, “more to the right”, “extreme right”, and corresponding left-side requests update the existing current position instead of resetting to a fixed original position.
- Group/together intent is stored in design state for diagnostics/planning.

### Version history diagnostics
- Every archived version now includes its own Modification results block showing Applied, Partial, Not applied, or informational results for that version.

### Source element clarity
- “Grouped / partial” is renamed “Partially reusable”.
- The Source elements accordion explains that partially reusable people were detected inside a grouped crop: approximate movement/resizing is possible, but exact independent placement may be limited.

### UI
- Accordion arrows are larger and more visible.
- Source elements and Edit text & content accordions have a clearer background/container treatment.

### Version consistency
- UI/footer/API health/package metadata use version 7.34.

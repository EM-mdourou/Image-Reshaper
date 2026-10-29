# Image Reshaper V9.5 Test Report

V9.5 fixes two Interactive Extreme issues found during live testing:

- **Remove** now truly deletes the selected layer from the interactive layer stack. Hide/show remains a separate reversible visibility control, and Undo can restore a removed layer.
- Manual source extraction now carries the actual pixel dimensions of Exact/Cleaned/Transparent candidates. When the chosen asset replaces a Logo, QR, or Primary visual, the layer bounding box is recalculated to the real asset aspect ratio instead of keeping an unrelated old/default height.
- Extraction previews no longer use a fake fixed 100px height and now display each candidate's actual pixel dimensions.

Regression coverage: `v95-remove-extraction-geometry.test.mjs`.

# Image Reshaper — V7.30

## V7.30 changes

### Form / layout
- Step 2 and Step 3 are compact and stacked on the right side of Step 1.
- Top black hero/banner is shorter.
- Product title is now **Image Reshaper**.
- Download button now says **Download PNG**.
- Source elements is an open-by-default accordion.
- Edit text & content is an open-by-default accordion.
- Modify this design is on the left and Modification results is on the right.

### Re-generate
A new **Re-generate** button appears beside **Reshape with AI** after the first successful result.

Re-generate:
- keeps the same uploaded source;
- reuses cached source analysis/design state when available;
- creates a meaningfully different layout;
- preserves authoritative user-edited text;
- archives the current result into Previous versions before replacing it.

Compact banners use a deterministic alternate layout without re-running source analysis. Larger formats reuse the cached source manifest and current text state, then create a new composition.

### Semantic content normalization
Large formats and compact banners use more consistent content classification:
- portraits/person descriptions become Person elements;
- parser/meta prose is filtered out of editable text;
- venue/address placeholder phrases are not shown as values;
- price facts stay separate.

### Canvas theme styling
User-added text is styled in the actual PNG Canvas renderer. Source/theme/accent colors and typography hints are preferred over generic black.

### Clear / start over
Clear / start over does **not** reload the browser page. It clears the current design session, history, selected image and cached state so a new source can be uploaded.

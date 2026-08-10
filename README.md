# Muslim Link Image Reshaper — V7.23

## Dynamic text/content editor

V7.23 adds deterministic text editing to the current design.

After the first generated design, a dynamic **Edit text & content** panel appears. It only shows text elements that exist in the current design, so different posters can expose different fields.

Possible fields include:
- Headline
- Date / time
- Venue
- Address / location
- Call to action
- Speaker/person names
- Prices
- URLs
- Other additional text

There is no assumption that every poster has speakers, dates, prices, venues, or CTAs.

Users can:
- edit exact wording directly;
- remove an existing text element;
- use **+ Add text** to add a new item;
- click **Apply text changes** without asking the AI to rewrite the wording.

Text entered directly becomes authoritative current-design state and persists into future Modify versions.

## Exact text preservation

Headline wrapping no longer stops after a preferred line count and drops the remaining words. The renderer keeps the complete headline and adapts by wrapping or reducing type size.

## Modify this design

The natural-language Modify box remains available for visual/layout changes. Direct text edits persist through visual-only Modify requests unless the newest request explicitly changes that text field.

## History

Direct text edits create a new version and archive the previous version just like AI modifications.

## Retained V7.22 features

- Canvas-first composition
- Iterative modification history
- Exact target dimensions
- Source-analysis recovery/fallback
- Protected factual copy
- Reused visual assets

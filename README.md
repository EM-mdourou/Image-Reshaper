# Image Reshaper — V7.33

## V7.33
- One canonical source manifest is generated before size-specific layout and reused for large and compact destinations.
- Large and banner Source elements now receive the same canonical people/logo/background/text inventory.
- Venue/address values strip wrapping quotes, avoid duplicate values, and split combined venue/address when possible.
- Apply text changes now calls a re-layout pass so large-format baked-in text can actually change.
- Added text is mandatory during re-layout and is prioritized in compact text layout instead of being silently omitted.
- Existing source/theme text color handling is preserved; this version does not force a new color scheme.
- App version is 7.33 in footer/UI/backend.

# Mac App Store Assets

Apple accepts one to ten Mac screenshots in PNG or JPEG format. Every screenshot in a localization must use one accepted 16:10 size: 1280 x 800, 1440 x 900, 2560 x 1600 or 2880 x 1800 pixels. Images must not contain transparency.

## Prepared source material

The following finished 1280 x 800 Textuary images already have an accepted Mac App Store size and use synthetic article content:

- `../chrome/assets/reader-light-1280x800.png` — primary calm reader view
- `../chrome/assets/reader-dark-1280x800.png` — evening reader theme
- `../chrome/assets/library-1280x800.png` — private local Library

They show the same shared reader and Library interface used by packaged Safari. Before upload, inspect them again as Apple product-page assets and confirm that no browser-specific wording is visible.

Do **not** use `../chrome/assets/reader-voice-1280x800.png` for the Mac listing: it displays Chrome's Natural (Kokoro) engine. The Apple-specific `assets/reader-premium-1280x800.png` shows **Premium (Apple)** with Selena Premium through the Safari-compatible interface.

## Recommended order

1. Reader in the paper theme
2. Safari Premium (Apple) voice and speed controls
3. Private local Library
4. Reader in the evening theme

The app icon is supplied through the complete macOS `AppIcon.appiconset` in the Xcode project and is extracted from the uploaded build. A separate promotional tile is not required for the Mac App Store product page.

## Final checks

- [x] 16:10 aspect ratio at an accepted pixel size
- [x] PNG with no alpha channel
- [x] authentic current 2.8 interface
- [x] Safari/Apple speech wording only
- [ ] no personal data, private URL, debug panel, temporary notice or test artefact
- [x] text remains readable at App Store thumbnail size
- [x] screenshots ordered to explain reader, speech, Library and theme at a glance

Official specification: <https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/>

# Textuary 2.8.0

Textuary turns ordinary web articles into a calm, private reading view in Chrome and Safari. Version 2.8 is the first release candidate validated across macOS Chrome, packaged Safari, and Windows 11 Chrome.

## Highlights

- Clean article extraction with headings, links, images, and supported embedded media
- Adjustable typeface, text size, line spacing, column width, and paper/evening themes
- Reading progress, estimated time remaining, and a distraction-free floating progress display
- Read aloud with browser/system voices, optional local Kokoro natural voices where WebGPU is available, and Apple Premium voices in the packaged Safari app
- A private, account-free local Library with offline article text, saved reading positions, and same-tab return to the article
- Print and PDF output with the selected reader typeface and one-inch page margins
- Keyboard shortcut: `Alt+Shift+R` (`Option+Shift+R` on macOS)

## Privacy

Textuary does not require an account, display ads, or upload saved articles. Reader preferences, Library entries, and reading positions remain in the browser's local extension storage. Optional Kokoro voice models are downloaded from Hugging Face when Natural voice mode is first used.

## Platform notes

- Chrome: unzip `textuary-2.8.0.zip`, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the extracted folder.
- Safari: the packaged macOS extension is built from the included Xcode project. Public App Store distribution is a later release step.
- Natural (Kokoro) voice mode requires WebGPU. Textuary automatically retains its System voice option when WebGPU is unavailable, as verified on the Windows 11 test machine.

## Known limits

- Textuary can only read article content delivered to the browser; it does not circumvent authentication or publisher access controls.
- Offline Library snapshots preserve clean article text. Externally hosted images and videos may still require a network connection.
- iPhone and iPad support has not yet been claimed or release-tested.

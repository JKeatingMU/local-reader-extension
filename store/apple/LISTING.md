# Mac App Store Listing

Prepared for the first Textuary 2.8.0 macOS release. Confirm the final rendering and wording in App Store Connect before submission.

## App record

**Platform:** macOS only

**Name:** Textuary

**Subtitle:** A calm article reader

**Primary language:** English (UK)

**Bundle ID:** `com.jgkeating.textuary`

**Extension bundle ID:** `com.jgkeating.textuary.Extension`

**SKU:** `textuary-macos`

**Version:** 2.8.0

**Build:** 1

**Primary category:** Productivity

**Secondary category:** Utilities

**Price:** Free

**Copyright:** 2026 J. G. Keating

## Promotional text

Turn web articles into a calm reading space with thoughtful typography, progress tracking, a private local Library and natural on-device read-aloud.

## Description

Textuary transforms an article open in Safari into a calm, focused reading space.

Read without the clutter. Textuary identifies the article already delivered to Safari, removes distracting page furniture and presents the headline, author, publication details, images and supported video in a clean reading view.

Make the page your own:

• Choose from four typefaces
• Adjust text size, line spacing and column width
• Use paper, evening or automatic ambient themes
• Follow estimated reading time, live progress and time remaining
• Print or save a clean PDF using your selected reading style

Listen privately:

• Use Safari's system voices or installed Apple Enhanced and Premium voices
• Choose a voice and playback speed
• Pause, resume or stop while the current passage is highlighted
• Hear the title, author and publication date when available
• Speech is generated on your Mac; article text is not sent to the developer

Keep articles for later:

• Save clean article snapshots to a private, account-free Library
• Search saved articles and mark them read or unread
• Restore reading and read-aloud positions
• Read saved prose offline
• Delete individual articles or clear the Library at any time

Textuary runs only when you activate it for the current Safari tab. Article processing and Library storage stay on your Mac. There is no account, advertising, analytics or tracking.

Textuary can reorganise only content that a website has delivered to Safari. It does not retrieve unavailable content or bypass authentication and publisher access controls. Externally hosted images and video may require an internet connection.

## Keywords

`reader,reading,articles,safari,speech,voice,typography,offline,library,focus`

## URLs

- Marketing URL: <https://github.com/JKeatingMU/local-reader-extension>
- Support URL: <https://github.com/JKeatingMU/local-reader-extension/blob/main/SUPPORT.md>
- Privacy Policy URL: <https://github.com/JKeatingMU/local-reader-extension/blob/main/PRIVACY.md>

## App Privacy

Select **No, we do not collect data from this app**.

The Safari release processes the user-selected page and stores preferences, saved articles and reading state on the device. The extension's native speech messages stay between the Safari extension and its containing Textuary app, and speech is generated through Apple's on-device `AVSpeechSynthesizer`. Textuary has no analytics, advertising, telemetry, developer account or cloud synchronisation.

Apple defines collection as transmitting data off the device and retaining it in readable form longer than needed to service a real-time request. The current macOS release does not do that. Keep this answer under review if a future release adds synchronisation, analytics or any developer-operated service.

## Content rights

Textuary accesses third-party content only when the user activates it for a page already open in Safari. It does not bundle, curate, sell or independently redistribute publisher content, and it respects authentication and access controls. Review the exact App Store Connect question before answering; if asked whether the app *accesses* third-party content, the accurate answer is **Yes**, followed by confirmation that the app is permitted to process user-selected pages in this manner.

## Age rating

Complete the current questionnaire from the app's actual behaviour. Textuary is not a web browser and does not provide an independent navigation interface; it processes only the page the user has already selected in Safari. Do not guess at **Unrestricted Web Access** until the exact App Store Connect wording and help text are visible.

## Export compliance

The macOS target declares `ITSAppUsesNonExemptEncryption = NO`. Textuary does not implement proprietary or non-exempt encryption; ordinary HTTPS is supplied by the operating system and browser.

## App Review notes

Textuary is a Safari Web Extension contained in a macOS app. No account or test credentials are required.

Test procedure:

1. Launch Textuary and choose **Open Safari Settings**.
2. Enable **Textuary** in Safari's Extensions settings and allow access when Safari asks.
3. Open a substantial public article over HTTPS and wait for it to load.
4. Click the Textuary toolbar button. The selected article becomes a clean reading view in the same tab.
5. Test the reading-time display, progress bar, Reading style controls, Voice controls and passage highlighting.
6. For Premium speech, install an Apple Enhanced or Premium voice in macOS **System Settings > Accessibility > Read & Speak**, choose **Premium (Apple)** in Textuary, then choose the installed voice. Speech is generated on-device using `AVSpeechSynthesizer`.
7. Open **Actions**, choose **Save article**, open **Library**, then use **Return to article**.
8. Choose **Original page** to restore the source page.

Textuary can process only content delivered to Safari. It does not bypass sign-in, subscription or publisher access controls.

## Release option

Use **Manually release this version** for the first submission so approval and public release remain separate decisions.

## Required screenshots

- `../chrome/assets/reader-light-1280x800.png` — primary paper reader
- `assets/reader-premium-1280x800.png` — Premium (Apple) voice and speed controls
- `../chrome/assets/library-1280x800.png` — private local Library
- `../chrome/assets/reader-dark-1280x800.png` — evening reader theme

All four are 1280 x 800 opaque PNGs, an accepted Mac App Store size. See [`ASSETS.md`](ASSETS.md) for the final upload checks.

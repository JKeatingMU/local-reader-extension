# Textuary Store Publishing and Product Roadmap

Last reviewed: 9 August 2026

Textuary can be distributed through both the Chrome Web Store and Apple's App Store. Chrome accepts a packaged browser extension directly. Safari distribution uses a signed macOS or iOS application containing the Safari Web Extension.

## Current position

Version 2.8.0 is released on GitHub and merged into `main`. It passed manual macOS Chrome, packaged Safari and Windows 11 Chrome validation. Its Chrome Web Store item was submitted with deferred publishing on 9 August 2026 and is pending review. It includes:

- Manifest V3 extension
- compatible with Chrome and Safari
- minimal `activeTab` and `scripting` permissions
- no account, analytics or advertising
- article content is processed locally
- Readability and DOMPurify are included locally rather than loaded remotely
- tested on ordinary articles across multiple publishers
- estimated read time, live reading progress and time remaining
- remembered typography, paper, evening and automatic ambient themes
- read-aloud passage highlighting
- optional Kokoro natural voices generated locally with WebGPU
- an explicit approximately 330 MB first-use model download and browser cache
- system-voice fallback and spoken author/publication metadata
- a containing macOS/iOS application and Safari Web Extension
- installed Apple Enhanced and Premium voices through on-device `AVSpeechSynthesizer`
- an account-free local Library with offline clean-text snapshots
- restored article position, read/unread state, storage reporting and deletion controls

## Shared preparation

Before either submission:

1. Add a public privacy policy explaining that page content is processed locally and is not transmitted to the developer or third parties.
2. Use the store-safe **Textuary — Article Reader & Text Sanctuary** identity, summary and longer description. Avoid comparisons with another browser in store metadata.
3. Create current screenshots showing the reader, themes and read-aloud controls.
4. Confirm icon and promotional artwork at every store-required size.
5. Provide a support URL, most likely the GitHub repository and its Issues page.
6. Run automated tests and manual Chrome and Safari checks against the exact release package.
7. Test the exact release package in Chrome on Windows; development and testing to date have been on macOS only.
8. Keep all privacy declarations consistent with the extension's permissions and actual behaviour.

### Required Windows Chrome validation

Completed on Windows 11 using the exact 2.8.0 RC1 ZIP on 9 August 2026:

- the unpacked extension installs and opens correctly
- article extraction works across several ordinary publishers
- the complete toolbar remains on one line at common desktop window sizes
- light, dark and other available themes render correctly
- text-size and read-aloud controls work with Windows-provided voices
- pause, resume, stop, voice selection and playback speed behave correctly
- the documented `Alt+Shift+R` shortcut opens Textuary
- printing and PDF output have a clean layout
- returning to the original page works correctly
- no macOS-only assumptions appear in paths, fonts, shortcuts or instructions

All reader, Library, navigation, shortcut, print and System-speech checks passed. Natural (Kokoro) was disabled because that Chrome session did not expose WebGPU, and Textuary correctly retained its System-voice fallback. Kokoro generation performance on WebGPU-capable Windows hardware remains useful optional coverage.

## Chrome Web Store

Chrome is the more direct first release.

### Preparation

- Create a clean ZIP containing only the extension's runtime files and required licences.
- Supply the existing 128 x 128 PNG store icon.
- Create at least one 1280 x 800 screenshot.
- Create the required 440 x 280 promotional tile.
- Write the single-purpose statement and permission explanations.
- Complete the privacy declarations, including local processing of website content.
- Choose public, unlisted or private distribution. Public is the intended eventual release.

### Account and submission

1. Register a Chrome Web Store developer account and pay Google's one-time registration fee.
2. Upload the release ZIP in the Developer Dashboard.
3. Complete the Store Listing, Privacy, Distribution and test-instructions sections.
4. Submit the item for review, optionally using deferred publishing so release remains manual after approval.
5. Monitor the developer email address and dashboard for questions or review results.

All Chrome items undergo review. Review duration varies, and Google warned in April 2026 that a submission surge was causing extended review times.

Submission status on 9 August 2026: **Pending review**, under publisher **J. G. Keating**, item ID `jgckcgnhfjjpcdbenhgfcdgfnkojkdca`. Automatic publication is disabled. If approved, the staged release must be manually published within 30 days.

## Safari and the App Store

Safari extensions are distributed in the Extensions category of Apple's App Store, not through a separate Safari extension gallery. Permanent distribution requires a signed containing application.

### Membership and packaging

- Join the Apple Developer Program. Apple currently lists membership at US$99 per year, or local currency where available.
- Choose an initial target. A macOS-only release is the simplest match for the version already tested; iPhone and iPad support can follow after device-specific testing.
- Package the extension either with Xcode or with Apple's Safari Web Extension Packager in App Store Connect.
- Assign unique bundle identifiers and version/build numbers.
- Add icons for the containing application and extension.

### Testing and submission

1. Create the App Store Connect app record.
2. Upload and process the packaged build.
3. Test the signed build locally and optionally through TestFlight.
4. Complete the product page, screenshots, support and privacy information.
5. Declare the app's data practices accurately; the current extension does not transmit article content or analytics off the device.
6. Select the build, complete compliance questions and submit it for App Review.

Preparation completed on 9 August 2026:

- selected a macOS-only first release
- retained explicit app and extension identifiers `com.jgkeating.textuary` and `com.jgkeating.textuary.Extension`
- verified a universal unsigned Release archive for Apple Silicon and Intel Macs
- added the Productivity category and non-exempt-encryption declaration to the packaged app
- removed unused file-access and outgoing-network entitlements from the macOS targets
- prepared Apple-specific product copy, privacy rationale, reviewer instructions and a submission checklist under [`store/apple`](store/apple)

The next Apple action is account-side: confirm Apple Developer Program membership, add the Apple team to Xcode, then create and upload a signed App Store Connect build. The current Mac has no valid code-signing identity installed.

## Suggested sequence

1. Prepare the shared privacy policy, copy, artwork and release packaging.
2. Complete and record the Windows Chrome validation.
3. Submit the proven desktop version to the Chrome Web Store.
4. Create and test the permanent macOS Safari package.
5. Submit the Safari version to the App Store.
6. Refresh store copy, screenshots and privacy disclosures for the 2.8 local Library if it is included in the first public release.
7. Continue with media-complete offline snapshots and the version 2.9 personal-archive design while the first submissions are being reviewed.

## Current publishing progress

Completed on 6 August 2026:

- public privacy policy and support guide
- draft Chrome Web Store listing, single-purpose statement and permission explanations
- store icon, light and dark 1280 x 800 screenshots, and 440 x 280 promotional tile
- allowlisted Chrome release staging and ZIP generation
- automated package, store-asset and cross-browser namespace checks
- distinctive store identity: **Textuary — Article Reader & Text Sanctuary**
- macOS Chrome smoke validation of the 2.5.0 reading-experience runtime at 1280 x 800
- estimated reading time, progress indicator and dynamic time remaining
- remembered typography controls plus paper, evening and automatic ambient themes
- read-aloud follow highlighting
- manual macOS Chrome listening and reader validation, including Kokoro voices
- manual packaged macOS Safari validation with Selena Premium
- manual Chrome and Safari validation of complete headlines, images and video cleanup
- manual macOS Chrome and packaged Safari validation of the complete 2.8 Library, toolbar, printing and read-aloud interface
- refreshed 2.8 Chrome Store listing, permission disclosures and six validated store assets

Completed on 9 August 2026:

- registered and verified the Chrome Web Store developer account under publisher **J. G. Keating**
- uploaded the validated 2.8.0 Chrome package, listing copy, icon, four screenshots and promotional tile
- completed the privacy, distribution and reviewer-test declarations
- selected free, public availability in all regions
- submitted item `jgckcgnhfjjpcdbenhgfcdgfnkojkdca` for review with deferred publishing

Next Chrome action: monitor the verified developer email and dashboard, answer any reviewer questions, and manually publish within 30 days after approval.

## Product roadmap after publication

### Version 2.5: reading experience — completed 6 August 2026

- [x] estimated reading time
- [x] slim reading-progress indicator
- [x] dynamic estimated time remaining
- [x] typography controls for font, line spacing and column width
- [x] paper, evening and ambient themes
- [x] locally remembered preferences
- [x] read-aloud follow highlighting

### Version 2.6: natural read-aloud — completed on macOS 8 August 2026

- [x] opt-in Kokoro FP32 model and 28 English voices
- [x] local WebGPU speech generation with system fallback
- [x] model-download consent and progress messaging
- [x] passage prefetch, pause, resume and stop
- [x] speak title, author, publication date and standfirst before the body
- [x] automated Chrome control-flow test and real FP32/WebGPU generation test on macOS
- [x] manual listening test in ordinary macOS Chrome
- [ ] Kokoro generation and performance test on WebGPU-capable Windows hardware; Windows 11 fallback behaviour passed when WebGPU was unavailable
- [x] keep Safari System-only for 2.6 after ONNX WebGPU testing hung during first inference

### Version 2.7: native Apple Premium voices — completed on macOS 8 August 2026

- [x] preserve the failed Safari Kokoro experiment on `feature/safari-kokoro-wasm`
- [x] create a multiplatform macOS/iOS containing application and Safari Web Extension
- [x] enumerate installed Enhanced and Premium Apple voices without transmitting article text
- [x] connect voice, speed, play, pause, resume, stop and passage highlighting to `AVSpeechSynthesizer`
- [x] retain Chrome's Kokoro implementation and Chrome manifest independently
- [x] automated mocked Safari control-flow test
- [x] unsigned and locally signed macOS builds
- [x] manual packaged-Safari listening test with Selena Premium
- [ ] install Xcode's matching iOS platform component and complete a generic device build
- [ ] physical iPad/iPhone Safari test

### Version 2.7.1: reader media refinement — completed 8 August 2026

- [x] prefer a longer credible metadata headline when Readability selects a shortened visible heading
- [x] promote common lazy-image and responsive-image sources before extraction
- [x] preserve sanitised native video sources, posters and user-operated controls without autoplay
- [x] remove clustered video-player status labels without removing editorial captions or prose
- [x] automated Chrome and Safari-mode media regression tests
- [x] manual Safari test against the Daily Mail comparison article

### Version 2.8: personal reading library — completed on macOS 9 August 2026

- [x] save clean article text locally without an account
- [x] reopen a saved article in the full Textuary reading experience
- [x] search and filter the local Library
- [x] restore reading position
- [x] restore the current read-aloud passage after pause and reload
- [x] read and unread state
- [x] approximate storage usage, individual deletion and clear-all controls
- [x] same-tab Library return-to-article navigation and live saved-state synchronisation
- [x] group Original page and Library as navigation, consolidate Save and Print under Actions, and combine engine, voice and speed in a labelled Voice popover
- [x] move dynamic time remaining into a floating desktop gutter indicator with a responsive toolbar fallback
- [x] standalone print stylesheet with one-inch layout, selected reader typeface and page-break rules
- [x] update the privacy policy and README for local article storage
- [x] automated live-package validation in Chrome and Safari modes
- [x] manual macOS Chrome and Safari validation
- [x] Windows 11 Chrome validation using the exact RC1 ZIP, with expected System-voice fallback when WebGPU was unavailable
- [ ] physical iPad/iPhone Safari test

### Version 2.8.1: media-complete offline snapshots

- cache selected article images locally with bounded size and clear failure handling
- show when a snapshot is text-only or fully offline
- define per-article and total storage limits before requesting any broader storage permission
- evaluate whether video should remain linked rather than cached because of storage cost
- update privacy and store disclosures if storage behaviour or permissions change

### Version 2.9: personal reading archive

Detailed design: [`VERSION_2_9_PLAN.md`](VERSION_2_9_PLAN.md)

- [ ] create user-defined reading lists with many-to-many article membership
- [ ] add free-form tags and Library filtering by tag
- [ ] add searchable article-level Markdown notes with timestamps
- [ ] define a versioned Textuary Library XML vocabulary and XSD
- [ ] export and import full-fidelity XML archives, including original links and optional offline snapshots
- [ ] provide an equivalent versioned JSON backup and restore format
- [ ] export human-readable Markdown reading lists containing links, metadata, tags and notes
- [ ] support XML-based OPML exchange for interoperable link-oriented reading lists
- [ ] preview imports and safely merge duplicates, lists, tags and notes
- [ ] migrate the current Library schema without losing version 2.8 articles or progress
- [ ] validate hostile, malformed and oversized imports before changing local storage
- [ ] retain the local-only, no-account design and current minimal permission model

### Later release: useful extras

- clean HTML article export
- PDF export through the print workflow
- optional focus timer
- local reading history and statistics
- passage-level highlights and resiliently anchored comments

## Actions that require the account owner

The technical packages, tests, artwork drafts and listing copy can be prepared in the repository. The account owner must personally complete or approve developer enrollment, fees, legal agreements, identity and tax details where applicable, and final store submission confirmations.

## Official references

- [Register a Chrome Web Store developer account](https://developer.chrome.com/docs/webstore/register/)
- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
- [Complete a Chrome Web Store listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Store privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Distribute a Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
- [Package Safari Web Extensions with App Store Connect](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)
- [Create a new App Store Connect app record](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
- [Mac screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [Manage App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [EU Digital Services Act trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
- [Apple Developer Program membership details](https://developer.apple.com/programs/whats-included/)

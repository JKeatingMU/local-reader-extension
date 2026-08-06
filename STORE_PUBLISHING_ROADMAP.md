# Local Reader Store Publishing Roadmap

Last reviewed: 6 August 2026

Local Reader can be distributed through both the Chrome Web Store and Apple's App Store. Chrome accepts a packaged browser extension directly. Safari distribution uses a signed macOS or iOS application containing the Safari Web Extension.

## Current position

Version 2.4.0 is a good release candidate:

- Manifest V3 extension
- compatible with Chrome and Safari
- minimal `activeTab` and `scripting` permissions
- no account, analytics or advertising
- article content is processed locally
- Readability and DOMPurify are included locally rather than loaded remotely
- tested on ordinary articles across multiple publishers

## Shared preparation

Before either submission:

1. Add a public privacy policy explaining that page content is processed locally and is not transmitted to the developer or third parties.
2. Prepare a store-safe name, summary and longer description. Describe Local Reader as a clean, distraction-free reader; avoid comparisons with another browser in store metadata.
3. Create current screenshots showing the reader, themes and read-aloud controls.
4. Confirm icon and promotional artwork at every store-required size.
5. Provide a support URL, most likely the GitHub repository and its Issues page.
6. Run automated tests and manual Chrome and Safari checks against the exact release package.
7. Keep all privacy declarations consistent with the extension's permissions and actual behaviour.

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

## Suggested sequence

1. Prepare the shared privacy policy, copy, artwork and release packaging.
2. Submit the proven desktop version to the Chrome Web Store.
3. Create and test the permanent macOS Safari package.
4. Submit the Safari version to the App Store.
5. Develop version 2.5 while the first submissions are being reviewed.
6. Treat later storage features carefully: saved articles, offline snapshots and persistent typography settings must be reflected in permissions, privacy disclosures and store descriptions.

## Product roadmap after publication

### Version 2.5: reading experience

- estimated reading time
- slim reading-progress indicator
- dynamic estimated time remaining
- typography controls for font, line spacing and column width
- paper, evening and ambient themes
- locally remembered preferences
- read-aloud follow highlighting

### Later release: personal reading library

- save clean articles locally without an account
- offline article snapshots
- restore reading position
- read and unread state
- storage usage and clear deletion controls

### Later release: useful extras

- Markdown and clean HTML export
- PDF export through the print workflow
- optional focus timer
- local reading history and statistics

## Actions that require the account owner

The technical packages, tests, artwork drafts and listing copy can be prepared in the repository. The account owner must personally complete or approve developer enrollment, fees, legal agreements, identity and tax details where applicable, and final store submission confirmations.

## Official references

- [Register a Chrome Web Store developer account](https://developer.chrome.com/docs/webstore/register/)
- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
- [Complete a Chrome Web Store listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Store privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Distribute a Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
- [Package Safari Web Extensions with App Store Connect](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)
- [Apple Developer Program membership details](https://developer.apple.com/programs/whats-included/)

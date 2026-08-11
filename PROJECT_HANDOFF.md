# Textuary Project Handoff

Snapshot date: 11 August 2026

This is the canonical restart point for Textuary. Read this file first in a new working session, then follow the linked plans for detailed release or feature work.

## Milestone reached

Textuary 2.8.0 is a tested Chrome and Safari article reader with a private local Library and read-aloud support. It is released on GitHub and publicly published in the Chrome Web Store.

The product relationship is now settled: **QFP quietens discovery; Textuary quietens reading.** Quiet Front Page remains a separate companion extension rather than becoming a Textuary mode.

- Repository: <https://github.com/JKeatingMU/local-reader-extension>
- Local working copy: `/Users/jgkeating/scratch/local-reader-extension`
- Current branch: `main`
- Chrome Web Store submission commit: `e6d9b08`
- Release tag: `v2.8.0` at commit `7ff9f2e`
- GitHub release: <https://github.com/JKeatingMU/local-reader-extension/releases/tag/v2.8.0>
- Release ZIP: `textuary-2.8.0.zip`
- ZIP SHA-256: `4d8fdb8478d8e3c0a91f1a3c484040816bccb6842eae3d73066ecef9102ea0cf`

The feature branches remain preserved, including `feature/kokoro-natural-voices` and `feature/safari-native-premium-voices`. The complete validated history was fast-forwarded into `main` rather than squashed.

## Chrome Web Store status

- Status: **Published — public**
- Submitted: 9 August 2026
- Approved and manually published: 11 August 2026
- Publisher: **J. G. Keating**
- Item ID: `jgckcgnhfjjpcdbenhgfcdgfnkojkdca`
- Pricing: free
- Visibility: public
- Regions: all regions, including unlisted/future regions
- Publication method: deferred publication followed by manual release
- Contact email: configured and verified in the developer dashboard
- Reviewer credentials: none required

The Chrome Web Store dashboard confirmed both **Success — publish request submitted** and **Published — public** on 11 August 2026. The next Chrome actions are operational rather than submission work: confirm the public listing has propagated, perform a clean-profile installation from the store, and monitor installs, reviews, support reports and policy notifications. Do not upload a replacement package merely to alter repository documentation; future store packages should correspond to intentional versioned releases.

The published privacy declarations are:

- remote code: **No** — all JavaScript and WebAssembly are packaged; downloaded Kokoro model weights and voices are data
- data categories: **Location**, **Web history**, **User activity** and **Website content**
- all three Limited Use certifications selected
- privacy policy: <https://github.com/JKeatingMU/local-reader-extension/blob/main/PRIVACY.md>

`Location` covers ordinary IP/request metadata received by Hugging Face when the user opts into the Natural-voice model download. `Web history` covers the selected page URL, `User activity` covers locally retained reading progress, and `Website content` covers the selected article. Article text and URLs are not sent to the developer or to a speech service.

## Validated platforms

- macOS Chrome: complete 2.8 reader, Library, navigation, printing, system speech and Kokoro speech validated
- packaged macOS Safari: complete reader and Library validated; installed Apple Enhanced/Premium voices are spoken on-device through the containing app
- Windows 11 Chrome: complete reader, Library, navigation, shortcut, printing and System speech validated from the RC1 package

The rebuilt final Chrome ZIP has different archive metadata from RC1, but its unpacked runtime files have no differences from the Windows-tested package.

Natural/Kokoro speech was unavailable on the tested Windows Chrome session because WebGPU was not exposed. The Natural option correctly remained disabled and high-quality Windows System voices worked. Kokoro on WebGPU-capable Windows hardware is useful optional coverage, not a blocker.

## Current product behavior

Textuary runs only after the toolbar action or `Alt+Shift+R` / `Option+Shift+R` shortcut is invoked for the active tab. Version 2.8 includes:

- Readability-based article extraction and DOMPurify sanitisation without publisher-specific adapters
- clean headings, links, supported images and embedded media
- four typefaces plus text size, line spacing and column-width controls
- paper, evening and automatic ambient themes
- reading-time estimate, progress bar and floating time remaining
- System read-aloud with voice and speed selection, pause/resume/stop and passage highlighting
- optional local Kokoro voices in Chrome where WebGPU is available
- Apple Enhanced/Premium voices in packaged Safari through native `AVSpeechSynthesizer`
- spoken author and publication metadata when captured
- account-free local Library with search, read/unread status, storage reporting and deletion controls
- clean-text offline snapshots, restored reading position and restored read-aloud position
- same-tab Library navigation and return to article
- clean printing/PDF using the selected reader typeface and one-inch margins

Textuary can only reorganise content actually delivered to the browser. It does not bypass authentication or publisher access controls. Saved clean text works offline; externally hosted images and video may still require a connection.

## Architecture and permissions

Chrome manifest permissions are deliberately narrow:

- `activeTab`
- `scripting`
- `storage`

The Safari manifest additionally uses `nativeMessaging` to exchange short speech commands and passages with Textuary's own containing application extension.

Readability, DOMPurify, Kokoro.js, Transformers.js, the phonemizer runtime and ONNX WebAssembly runtime are packaged locally. After explicit consent, optional Kokoro model and voice data are downloaded from Hugging Face and cached by the browser; approximately 330 MB is required. Speech generation remains local.

The Safari solution deliberately uses native Apple speech instead of running Kokoro in Safari. Earlier browser-side Kokoro experiments were slow and unstable in WebKit, including a WebContent crash. The current native implementation is the proven Safari path.

## Verification commands

Build and validate the Chrome Store package:

```sh
npm run release:chrome
```

This generates:

- `dist/chrome/textuary-2.8.0/`
- `dist/chrome/textuary-2.8.0.zip`

Build the macOS Safari app and extension without production signing:

```sh
xcodebuild -quiet \
  -project safari/Textuary/Textuary.xcodeproj \
  -scheme 'Textuary (macOS)' \
  -configuration Debug \
  -derivedDataPath /private/tmp/Textuary28Derived \
  CODE_SIGNING_ALLOWED=NO \
  build
```

The unsigned Safari build and universal Release archive pass. Xcode currently reports only a non-fatal SDK concurrency warning about `AVSpeechSynthesizer` not conforming to `Sendable`; the earlier unused `profile` warning has been removed.

## Store materials

- Listing copy and declarations: [`store/chrome/LISTING.md`](store/chrome/LISTING.md)
- Submission checklist: [`store/chrome/SUBMISSION_CHECKLIST.md`](store/chrome/SUBMISSION_CHECKLIST.md)
- Asset inventory: [`store/chrome/ASSETS.md`](store/chrome/ASSETS.md)
- Screenshots and promotional tile: `store/chrome/assets/`
- Store icon: `icons/icon-128-store.png`
- Mac App Store listing: [`store/apple/LISTING.md`](store/apple/LISTING.md)
- Mac App Store submission checklist: [`store/apple/SUBMISSION_CHECKLIST.md`](store/apple/SUBMISSION_CHECKLIST.md)
- Mac App Store asset plan: [`store/apple/ASSETS.md`](store/apple/ASSETS.md)
- Privacy policy: [`PRIVACY.md`](PRIVACY.md)
- Support guide: [`SUPPORT.md`](SUPPORT.md)

## Next release work

Textuary's first public Chrome release is complete. Quiet Front Page 1.0.0 is now a packaged release candidate; its remaining release gates are a fresh manual macOS Chrome pass, exact-package Windows Chrome validation, the versioned GitHub release and Chrome Web Store submission. Textuary 2.9 remains the next major feature release, not an urgent change to the newly published 2.8 package.

Mac App Store repository preparation is complete for a macOS-only first Apple release: production bundle identifiers, version/build metadata, Productivity category, export-compliance declaration, universal unsigned Release archive, listing copy and the submission checklist are in place. Public Apple distribution was deliberately deferred on 9 August 2026 because the account has no paid Apple Developer Program membership and the user does not want to add the annual fee for this free extension yet. Textuary remains available to the user through the proven local Xcode/Safari installation. When revisited, the next Apple action is to enrol, add the Apple team to Xcode, create the App Store Connect record and upload a signed archive. iPhone/iPad support must not be claimed until a physical-device build and responsive extension workflow have been tested.

The detailed distribution sequence is in [`RELEASE_2_8_NEXT_STEPS.md`](RELEASE_2_8_NEXT_STEPS.md) and [`STORE_PUBLISHING_ROADMAP.md`](STORE_PUBLISHING_ROADMAP.md).

## Quiet Front Page companion

The separate companion extension lives at [`prototypes/quiet-front-page`](prototypes/quiet-front-page). It converts newspaper home and section pages into an ordered image-and-headline list, preserving original publisher links. It does not modify the published Textuary 2.8 runtime or package. Its product promise is paired but distinct: **QFP quietens discovery; Textuary quietens reading.**

The implementation uses generic semantic and repeated-card heuristics rather than publisher-specific adapters. Automated fixture coverage validates story filtering, deduplication, lazy images, order, responsive width and all view controls. Manual testing succeeded across seven newspaper sites. Version 0.2 added smaller default headlines and images, three typefaces, coordinated text-and-image sizes, and quiet placeholders for image-less stories. Version 0.3 adds inferred section labels and a metadata/structured-data/long-form classifier that routes likely individual articles to a Textuary shortcut or toolbar hand-off rather than constructing a misleading front page. Version 0.3.1 conservatively supports empty full-card overlay links when exactly one credible sibling headline shares the same bounded card. Version 0.3.2 excludes a leading standalone Premium access badge from the extracted headline while preserving ordinary headline text. Live landing-page checks pass on Irish Mirror, The Washington Post and The Journal; controlled tests reject ambiguous overlay cards, and live-article checks confirm the hand-off yields automatically when Textuary opens.

A separate multiplatform Safari Web Extension wrapper lives at [`safari/QuietFrontPage/Quiet Front Page`](safari/QuietFrontPage/Quiet%20Front%20Page). It has distinct Quiet Front Page bundle identifiers and artwork and references the shared extension sources. Manual macOS Safari testing passed on 10 August 2026, and the version-matched 1.0.0 macOS scheme completed a fresh unsigned build on 11 August. The physical iPhone/iPad target still needs testing but is not a blocker for a Chrome release.

The 1.0.0 release candidate is staged reproducibly by `npm run release:qfp`. Its Chrome package contains only the manifest, service worker, page renderer and four required runtime icons. Automated checks validate the public identity, exact `activeTab` and `scripting` permissions, absence of persistent site access and storage, store-asset dimensions, staged file inventory, keyboard-shortcut activation, six-story fixture extraction and original links. Current candidate output: `dist/chrome/quiet-front-page-1.0.0.zip`, 20,885 bytes, SHA-256 `fff5cab7e4c1d51994c6db495fc74c68ff4df85773f5a5cc8714e9a4610b9d5c`. Two consecutive builds produced the same checksum.

Store copy, reviewer instructions, privacy declarations and five validated assets are under [`store/qfp`](store/qfp). The public privacy and support documents are [`QUIET_FRONT_PAGE_PRIVACY.md`](QUIET_FRONT_PAGE_PRIVACY.md) and [`QUIET_FRONT_PAGE_SUPPORT.md`](QUIET_FRONT_PAGE_SUPPORT.md). Do not tag or create the GitHub release until the exact package has passed the fresh manual macOS and Windows Chrome checkpoints.

## Planned version 2.9

Version 2.9 augments saved reading rather than changing extraction. The agreed scope is:

- named reading lists
- multiple tags per article
- article-level Markdown notes/comments
- Library filtering and organisation
- full export and import with original source links
- first-class XML interchange with a documented XSD
- JSON for lossless machine-readable backup
- Markdown for readable archives
- OPML for link-oriented interoperability
- safe preview, validation, duplicate handling and schema migration

Do not start 2.9 by altering the current stored-article schema without first following the migration and interchange design in [`VERSION_2_9_PLAN.md`](VERSION_2_9_PLAN.md). Preserve all existing 2.8 Library entries and reading positions.

## Resume checklist

At the beginning of the next session:

1. Read this handoff and check `git status` and the current branch.
2. Confirm Textuary's public Chrome Web Store listing has propagated and install it once from a clean Chrome profile.
3. Preserve any Chrome Web Store policy email, support report or dashboard warning before changing code or declarations.
4. Run the fresh manual macOS Chrome pass, then test the exact Quiet Front Page 1.0.0 ZIP on Windows Chrome using [`store/qfp/SUBMISSION_CHECKLIST.md`](store/qfp/SUBMISSION_CHECKLIST.md).
5. Keep Textuary 2.9 schema and migration work isolated from the published 2.8 package.

# Textuary Project Handoff

Snapshot date: 9 August 2026

This is the canonical restart point for Textuary. Read this file first in a new working session, then follow the linked plans for detailed release or feature work.

## Milestone reached

Textuary 2.8.0 is a tested Chrome and Safari article reader with a private local Library and read-aloud support. It has been released on GitHub and submitted to the Chrome Web Store.

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

- Status: **Pending review**
- Submitted: 9 August 2026
- Publisher: **J. G. Keating**
- Item ID: `jgckcgnhfjjpcdbenhgfcdgfnkojkdca`
- Pricing: free
- Visibility: public
- Regions: all regions, including unlisted/future regions
- Automatic publication: disabled
- Contact email: configured and verified in the developer dashboard
- Reviewer credentials: none required

The next Chrome action is to monitor the verified publisher email and dashboard. If approved, the item will be staged rather than automatically published. It must then be manually published within 30 days of approval. If review remains pending for more than three weeks, use Chrome Web Store developer support. Do not cancel the pending review unless a real defect or material listing error is discovered.

The submitted privacy declarations are:

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

The unsigned Safari build passes. Xcode currently reports non-fatal warnings about `AVSpeechSynthesizer` not conforming to `Sendable` and an unused `profile` value.

## Store materials

- Listing copy and declarations: [`store/chrome/LISTING.md`](store/chrome/LISTING.md)
- Submission checklist: [`store/chrome/SUBMISSION_CHECKLIST.md`](store/chrome/SUBMISSION_CHECKLIST.md)
- Asset inventory: [`store/chrome/ASSETS.md`](store/chrome/ASSETS.md)
- Screenshots and promotional tile: `store/chrome/assets/`
- Store icon: `icons/icon-128-store.png`
- Privacy policy: [`PRIVACY.md`](PRIVACY.md)
- Support guide: [`SUPPORT.md`](SUPPORT.md)

## Next release work

Chrome is waiting on Google. The next distribution project is the signed Safari/App Store release. The recommended first Apple release is macOS-only because that is the proven target. It still requires Apple Developer Program membership, production bundle identifiers and signing, an App Store Connect record, archive/upload, store screenshots and declarations. iPhone/iPad support must not be claimed until a physical-device build and responsive extension workflow have been tested.

The detailed distribution sequence is in [`RELEASE_2_8_NEXT_STEPS.md`](RELEASE_2_8_NEXT_STEPS.md) and [`STORE_PUBLISHING_ROADMAP.md`](STORE_PUBLISHING_ROADMAP.md).

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
2. Check the Chrome Web Store dashboard and publisher email for a review result.
3. If approved, inspect the final public listing preview before manually publishing.
4. If Google asks a question or rejects the item, preserve the exact message and screenshot before changing code or declarations.
5. Choose between the macOS App Store submission and version 2.9 planning/implementation as the next active workstream.

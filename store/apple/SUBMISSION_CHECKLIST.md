# Mac App Store Submission Checklist

Prepared for Textuary 2.8.0 on 9 August 2026.

The first Apple release is deliberately **macOS-only**. iPhone and iPad support remain outside the listing until the physical-device workflow has been built and tested.

**Current status:** prepared but deliberately deferred. The user chose on 9 August 2026 to continue with Chrome Web Store distribution and retain the local Safari installation rather than pay for Apple Developer Program membership for this free extension. Preserve this checklist as the restart point.

## Completed in the repository

- [x] macOS containing app and Safari Web Extension targets
- [x] production-style app and extension bundle identifiers
- [x] version 2.8.0 and build 1
- [x] universal macOS archive containing Apple Silicon and Intel architectures
- [x] macOS 14.0 minimum deployment target
- [x] app sandbox and hardened runtime enabled
- [x] unused file-access and network entitlements removed
- [x] Productivity category set in the macOS target
- [x] non-exempt encryption declaration set to No
- [x] complete macOS app-icon set
- [x] public privacy policy and support guide
- [x] Apple-specific listing copy and review instructions
- [x] App Privacy rationale for **Data Not Collected**
- [x] manual packaged-Safari validation of the reader, Library and Apple Premium speech
- [x] unsigned Release archive verification

## Account and signing

- [ ] Confirm active Apple Developer Program membership.
- [ ] Accept any current Apple Developer and App Store Connect agreements.
- [ ] Add the Apple Account in **Xcode > Settings > Accounts**.
- [ ] Select the developer team for both macOS targets and retain automatic signing.
- [ ] Register the explicit App ID `com.jgkeating.textuary`.
- [ ] Confirm the contained extension identifier `com.jgkeating.textuary.Extension` is provisioned correctly.
- [ ] Confirm Xcode has a valid Apple Distribution signing identity.
- [ ] Resolve Digital Services Act trader status; this is the account owner's legal self-assessment.

## App Store Connect record

- [ ] Create a new **macOS** app named **Textuary**.
- [ ] Choose English (UK) as the primary language.
- [ ] Select bundle ID `com.jgkeating.textuary`.
- [ ] Use SKU `textuary-macos`.
- [ ] Choose full user access unless the account contains other users who should be restricted.
- [ ] Set Productivity as the primary category and Utilities as the secondary category.
- [ ] Set the app to Free.
- [ ] Select worldwide availability, subject to the account owner's regulatory choices.
- [ ] Choose manual release for version 2.8.0.

## Build and upload

- [ ] Create a signed Release archive with **Textuary (macOS)** and **Any Mac** selected.
- [ ] Run **Validate App** in Xcode Organizer and resolve every blocking issue.
- [ ] Distribute through **App Store Connect > Upload**.
- [ ] Wait for build 1 to finish processing.
- [ ] Select the processed 2.8.0 build in the macOS version page.
- [ ] If practical, install the signed build through TestFlight and repeat the Safari validation before review.

## Product page

- [ ] Paste the subtitle, promotional text, description and keywords from `LISTING.md`.
- [ ] Add the support, marketing and privacy-policy URLs.
- [ ] Upload one to ten opaque Mac screenshots at one accepted 16:10 size.
- [ ] Ensure every screenshot shows the Safari release, not Chrome-only Natural/Kokoro controls.
- [ ] Enter copyright `2026 J. G. Keating`.
- [ ] Review spelling, screenshot ordering and product-page preview.

## Declarations

- [ ] App Privacy: select **No, we do not collect data from this app** and publish the response.
- [ ] Complete the age-rating questionnaire from the current prompts.
- [ ] Complete the content-rights declaration accurately for user-selected third-party webpages.
- [ ] Confirm export compliance uses the packaged `ITSAppUsesNonExemptEncryption = NO` declaration.
- [ ] Confirm there are no in-app purchases, subscriptions, advertising identifiers or reviewer credentials.
- [ ] Complete any regional compliance fields required for the chosen availability.

## Review submission

- [ ] Paste the reviewer test procedure from `LISTING.md`.
- [ ] Confirm the review contact details and phone number.
- [ ] Save every section and check for unresolved red or amber warnings.
- [ ] Add build 1 to the submission.
- [ ] Submit version 2.8.0 for App Review.
- [ ] Preserve screenshots and the exact text of any reviewer question before changing the build or declarations.
- [ ] After approval, inspect the staged product page and manually release the version.

## Deferred account dependency

The local Mac currently has no valid code-signing identity. Repository preparation and unsigned archive validation are complete, but signing, upload and App Store Connect record creation require the account owner to join the paid Apple Developer Program and add that account/team to Xcode. This is a conscious distribution decision, not a Textuary defect.

## Verification command

```sh
xcodebuild -quiet \
  -project safari/Textuary/Textuary.xcodeproj \
  -scheme 'Textuary (macOS)' \
  -configuration Release \
  -destination 'generic/platform=macOS' \
  -archivePath /private/tmp/Textuary-2.8.0-audit.xcarchive \
  CODE_SIGNING_ALLOWED=NO \
  archive
```

This verifies the Release archive structure without pretending that an App Store-signed build exists.

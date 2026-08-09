# Textuary 2.8 Release Next Steps

Status: release preparation after successful macOS Chrome and Safari validation

This checklist records the work required before beginning Textuary 2.9. Version 2.8 is functionally complete; the remaining work is release preparation, Windows validation and store submission.

## 1. Close the 2.8 documentation

- [x] Record successful manual macOS Chrome and packaged Safari validation.
- [x] Refresh the Chrome Web Store listing for the 2.8 Library, toolbar, printing and read-aloud interface.
- [x] Update permission explanations and reviewer instructions for explicitly saved local article snapshots.
- [x] Keep the listing, privacy policy, support guide and manifests consistent.
- [x] Update the Chrome submission checklist from its earlier 2.5 scope.

## 2. Refresh store artwork

- [x] Replace the old reader screenshots with the finished 2.8 interface.
- [x] Include the main reader, Voice popover, evening theme and local Library.
- [x] Confirm every screenshot is an authentic 1280 x 800 PNG using synthetic article content.
- [x] Revalidate the 128 x 128 icon and 440 x 280 promotional tile.
- [x] Review every image at actual size for cropping, temporary notices and test artefacts.

## 3. Validate the exact release on Windows Chrome

- [ ] Install the unpacked release package in ordinary Windows Chrome.
- [ ] Confirm extraction across several ordinary public publishers.
- [ ] Check the complete toolbar at common desktop window sizes.
- [ ] Check paper, evening and ambient themes plus every typography control.
- [ ] Test Windows system voices, selection and playback speed.
- [ ] Test Kokoro/WebGPU startup, performance and fallback behaviour.
- [ ] Test pause, resume, Stop, passage highlighting and saved-passage restoration.
- [ ] Test Save article, Library, deletion, clear-all and Return to article.
- [ ] Test `Alt+Shift+R`.
- [ ] Test printing/PDF margins and the selected reader typeface.
- [ ] Confirm there are no macOS-only assumptions in copy, paths, fonts or shortcuts.

Record the Windows version, Chrome version, graphics adapter and any WebGPU fallback observed.

## 4. Create the final release

- [ ] Merge `feature/safari-native-premium-voices` into `main` without losing the preserved history.
- [ ] Confirm all manifests, package metadata and Xcode targets use version 2.8.0 and an appropriate build number.
- [ ] Run the complete automated checks and `npm run release:chrome`.
- [ ] Test the exact generated ZIP on macOS and Windows rather than relying only on the working directory.
- [ ] Create a checksum for the final ZIP.
- [ ] Tag `v2.8.0`.
- [ ] Create a GitHub release containing release notes, the Chrome ZIP and the checksum.

## 5. Submit to the Chrome Web Store

Account-owner actions:

- [ ] Register and configure the Chrome Web Store developer account.
- [ ] Confirm the public developer/publisher display name.
- [ ] Complete any required registration payment and account verification.
- [ ] Upload the final 2.8 ZIP and prepared assets.
- [ ] Complete the Store Listing, Privacy and Distribution sections.
- [ ] Select public, free distribution and the intended supported regions.
- [ ] Review the rendered listing and screenshot cropping.
- [ ] Submit with deferred publishing if a manual release after approval is preferred.
- [ ] Respond to reviewer questions and approve publication.

## 6. Prepare Safari/App Store distribution

- [ ] Decide whether the first Apple release is macOS-only or also claims iPhone/iPad support. A macOS-only first release is the lower-risk route.
- [ ] Confirm Apple Developer Program membership and agreements.
- [ ] Assign production bundle identifiers, signing and version/build numbers.
- [ ] Complete the containing application and extension icons.
- [ ] Create the App Store Connect record.
- [ ] Archive and upload the signed application.
- [ ] Add product screenshots, support URL, privacy policy and data-practice declarations.
- [ ] Test the uploaded build locally or through TestFlight.
- [ ] Complete compliance questions and submit for App Review.

## 7. Validate iPad/iPhone before claiming support

- [ ] Install Xcode's matching iOS platform component.
- [ ] Complete a generic iOS device build.
- [ ] Install and test on a physical iPad and/or iPhone.
- [ ] Check extension enablement, page access, responsive layout, Library storage and Premium Apple speech.
- [ ] Prepare device-specific App Store screenshots if iOS/iPadOS is included.

## 8. Optional 2.8.1 work

Media-complete offline snapshots are not a 2.8 release requirement. Image caching, storage limits and offline-state messaging can be evaluated while the store submissions are under review. Avoid delaying the proven 2.8 release unless testing exposes a genuine release blocker.

## Responsibility split

Codex can prepare documentation, artwork, packages, automated checks, branch integration, tags, checksums and release notes. The account owner must provide Windows/device access and personally approve developer enrolment, fees, agreements, identity details and final store submissions.

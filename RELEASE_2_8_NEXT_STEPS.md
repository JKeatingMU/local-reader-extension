# Textuary 2.8 Release Next Steps

Status: version 2.8.0 released after successful macOS Chrome, packaged Safari and Windows 11 validation

This checklist records the work required before beginning Textuary 2.9. Version 2.8 is functionally complete and has passed macOS Chrome, packaged Safari and Windows 11 validation; the remaining work is final release preparation and store submission.

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

- [x] Install the unpacked RC1 release package in ordinary Windows 11 Chrome.
- [x] Confirm extraction across several ordinary public publishers.
- [x] Check the complete toolbar at common desktop window sizes.
- [x] Check paper, evening and ambient themes plus every typography control.
- [x] Test Windows system voices, selection and playback speed.
- [x] Confirm graceful System-voice fallback when Chrome does not expose WebGPU; Natural (Kokoro) is disabled in that environment.
- [ ] Test Kokoro generation and performance on WebGPU-capable Windows hardware when such a device is available. This is useful coverage but not a blocker for the optional feature's documented fallback.
- [x] Test pause, resume, Stop, passage highlighting and saved-passage restoration.
- [x] Test Save article, Library, deletion, clear-all and Return to article.
- [x] Test `Alt+Shift+R`.
- [x] Test printing/PDF margins and the selected reader typeface.
- [x] Confirm there are no macOS-only assumptions in copy, paths, fonts or shortcuts.

Result recorded 9 August 2026: Windows 11 validation passed using RC1 from commit `ed65bfe`. All tested reader, Library, navigation, system-speech, shortcut and print features worked. Natural (Kokoro) was greyed out because WebGPU was unavailable to that Chrome session; the System-voice fallback worked well. Chrome version and graphics adapter were not recorded.

## 4. Create the final release

- [x] Merge `feature/safari-native-premium-voices` into `main` without losing the preserved history.
- [x] Confirm all manifests, package metadata and Xcode targets use version 2.8.0 and an appropriate build number.
- [x] Run the complete automated checks and `npm run release:chrome`.
- [x] Verify the exact generated ZIP on macOS and compare its unpacked contents byte-for-byte with the Windows-tested RC1 package.
- [x] Create a checksum for the final ZIP.
- [x] Tag `v2.8.0`.
- [x] Create a GitHub release containing release notes, the Chrome ZIP and the checksum.

Released 9 August 2026: [Textuary 2.8.0](https://github.com/JKeatingMU/local-reader-extension/releases/tag/v2.8.0). Final Chrome ZIP SHA-256: `4d8fdb8478d8e3c0a91f1a3c484040816bccb6842eae3d73066ecef9102ea0cf`. The rebuilt ZIP container differs from RC1 because of archive metadata, but its unpacked runtime files have no differences from the package validated on Windows 11.

## 5. Submit to the Chrome Web Store

Account-owner actions:

- [x] Register and configure the Chrome Web Store developer account.
- [x] Confirm the public developer/publisher display name.
- [x] Complete any required registration payment and account verification.
- [x] Upload the final 2.8 ZIP and prepared assets.
- [x] Complete the Store Listing, Privacy and Distribution sections.
- [x] Select public, free distribution and all supported regions.
- [x] Review the rendered listing and screenshot cropping.
- [x] Submit with deferred publishing so the release remains manual after approval.
- [ ] Respond to reviewer questions and approve publication.

Submitted 9 August 2026 under publisher **J. G. Keating**. Chrome Web Store item ID: `jgckcgnhfjjpcdbenhgfcdgfnkojkdca`. Dashboard status: **Pending review**. Automatic publication is disabled; an approved staged release must be published manually within 30 days.

## 6. Prepare Safari/App Store distribution

- [x] Decide that the first Apple release is macOS-only; iPhone/iPad support will not be claimed without physical-device testing.
- [ ] Confirm Apple Developer Program membership and agreements.
- [x] Assign production bundle identifiers and version/build numbers; signing awaits the Apple team.
- [x] Complete the containing application and extension icons.
- [ ] Create the App Store Connect record.
- [ ] Archive and upload the signed application.
- [x] Prepare Apple-specific listing copy, reviewer notes, support URL, privacy policy and data-practice rationale.
- [ ] Capture the Safari Premium-voice screenshot and upload the complete product screenshot set.
- [ ] Test the uploaded build locally or through TestFlight.
- [ ] Complete compliance questions and submit for App Review.

Repository audit completed 9 August 2026: the unsigned Release archive succeeds as a universal `arm64`/`x86_64` macOS application containing the Safari extension. The packaged app declares Productivity as its category and `ITSAppUsesNonExemptEncryption = NO`. No valid local code-signing identity is currently installed, so the remaining build work begins with Apple Developer membership and Xcode team configuration. See [`store/apple/SUBMISSION_CHECKLIST.md`](store/apple/SUBMISSION_CHECKLIST.md).

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

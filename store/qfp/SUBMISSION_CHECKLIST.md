# Quiet Front Page Chrome Web Store Submission Checklist

Prepared for Quiet Front Page 1.0.0 on 11 August 2026; release validation completed on 18 August 2026.

## Completed in the repository

- [x] Manifest V3 with only `activeTab` and `scripting`
- [x] no host permissions, storage, analytics, advertising or remote code
- [x] standalone public name: **Quiet Front Page — Clean News Homepages**
- [x] public privacy policy, support guide and issue tracker
- [x] single-purpose statement and permission justifications
- [x] store-safe summary, detailed description and reviewer instructions
- [x] article-page detection and optional Textuary hand-off
- [x] automated controlled-page extraction and interface regression coverage
- [x] manual multi-publisher macOS Chrome testing
- [x] packaged macOS Safari build and manual Safari testing

## Release-candidate preparation

- [x] validate the 128 × 128 store icon
- [x] capture and validate three 1280 × 800 product screenshots
- [x] render and validate the 440 × 280 promotional tile
- [x] complete the allowlisted Chrome packaging script and archive checksum
- [x] validate the exact staged Chrome manifest and file inventory
- [x] activate and inspect the exact staged package in an isolated macOS Chrome for Testing profile
- [x] run the complete macOS Chrome release-candidate regression
- [x] build the version-matched macOS Safari wrapper
- [x] test the exact release candidate on Windows 11 Chrome
- [x] commit the Windows result and freeze the final 1.0.0 release commit
- [x] create and publish the versioned GitHub release

RC1 Windows download: <https://github.com/JKeatingMU/local-reader-extension/releases/download/qfp-v1.0.0-rc1/quiet-front-page-1.0.0.zip>

Final release: <https://github.com/JKeatingMU/local-reader-extension/releases/tag/qfp-v1.0.0>

## Chrome Web Store submission

- [ ] add a new item under publisher **J. G. Keating**
- [ ] upload the generated QFP ZIP from `dist/chrome`
- [ ] complete the listing category and subcategory using the current dashboard choices
- [ ] complete the privacy fields consistently with `QUIET_FRONT_PAGE_PRIVACY.md`
- [ ] upload the prepared icon, screenshots and promotional tile
- [ ] select free, public distribution in all supported regions
- [ ] review the rendered listing for clarity and cropping
- [ ] submit for review with deferred publishing enabled
- [ ] preserve and respond to any reviewer questions
- [ ] inspect the accepted public listing preview and manually publish
- [ ] install once from the public store in a clean Chrome profile

## Release verification commands

```sh
npm run release:qfp
```

The command must finish successfully and produce both the staging directory and ZIP under `dist/chrome`.

Current candidate: `quiet-front-page-1.0.0.zip`, 20,885 bytes, SHA-256 `fff5cab7e4c1d51994c6db495fc74c68ff4df85773f5a5cc8714e9a4610b9d5c`. Two consecutive builds produced the same checksum.

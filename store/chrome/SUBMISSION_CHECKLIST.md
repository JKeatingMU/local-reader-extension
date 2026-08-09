# Chrome Web Store Submission Checklist

Updated for Textuary 2.8.0 on 9 August 2026.

## Completed in the repository

- [x] Manifest V3 with minimal `activeTab`, `scripting` and local-preference `storage` permissions
- [x] public privacy policy
- [x] public support guide and issue tracker
- [x] single-purpose statement and permission justifications
- [x] store-safe summary and detailed description
- [x] 128 x 128 PNG icon
- [x] 1280 x 800 light-theme screenshot
- [x] 1280 x 800 dark-theme screenshot
- [x] 1280 x 800 Natural voice controls screenshot
- [x] 1280 x 800 local Library screenshot
- [x] 440 x 280 small promotional tile
- [x] allowlisted release-packaging script
- [x] Chrome-specific manifest without Safari-only metadata
- [x] automated package and asset validation
- [x] macOS Chrome smoke test against the packaged runtime files
- [x] distinctive public name: **Textuary — Article Reader & Text Sanctuary**
- [x] account-free local Library with explicit local snapshot storage
- [x] same-tab Library return, saved-state synchronisation and restored reading positions
- [x] standalone one-inch print layout using the selected reader typeface
- [x] manual macOS Chrome and packaged Safari validation of version 2.8

## Release-preparation work

- [x] refresh all listing screenshots from the finished 2.8 interface
- [x] refresh the detailed description, `storage` justification and reviewer instructions for version 2.8
- [x] re-run package and store-asset validation after the refresh
- [ ] merge the release candidate to `main`, tag `v2.8.0` and publish a GitHub release

## Required before submission

- [x] complete Windows 11 Chrome validation using the exact RC1 ZIP; optional Kokoro generation remains untested where WebGPU is available
- [ ] register and configure the Chrome Web Store developer account
- [ ] confirm the developer/publisher display name
- [ ] upload the generated ZIP from `dist/chrome`
- [ ] complete the dashboard privacy fields consistently with `PRIVACY.md`
- [ ] upload the prepared screenshots and promotional tile
- [ ] select public distribution and supported regions
- [ ] review the rendered listing for clarity and cropping
- [ ] submit for review with deferred publishing enabled
- [ ] respond to any reviewer questions
- [ ] manually publish after approval

## Release verification commands

```sh
npm run release:chrome
```

The command must finish successfully and produce both the staging directory and ZIP under `dist/chrome`.

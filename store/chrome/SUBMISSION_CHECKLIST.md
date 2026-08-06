# Chrome Web Store Submission Checklist

Prepared for Local Reader 2.4.0 on 6 August 2026.

## Completed in the repository

- [x] Manifest V3 with minimal `activeTab` and `scripting` permissions
- [x] public privacy policy
- [x] public support guide and issue tracker
- [x] single-purpose statement and permission justifications
- [x] store-safe summary and detailed description
- [x] 128 x 128 PNG icon
- [x] 1280 x 800 light-theme screenshot
- [x] 1280 x 800 dark-theme screenshot
- [x] 440 x 280 small promotional tile
- [x] allowlisted release-packaging script
- [x] Chrome-specific manifest without Safari-only metadata
- [x] automated package and asset validation
- [x] macOS Chrome smoke test against the packaged runtime files

## Required before submission

- [ ] choose the final public store name; another product currently uses “Local Reader” as the start of its title
- [ ] complete the Windows Chrome validation in the project roadmap
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


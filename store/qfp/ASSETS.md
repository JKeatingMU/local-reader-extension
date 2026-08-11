# Quiet Front Page Chrome Web Store Assets

The store submission uses authentic Quiet Front Page UI rendered against the synthetic Morning Ledger fixture. This avoids publishing third-party newspaper text or imagery in marketing materials.

- Store icon: `assets/store-icon-128.png`, a padded 128 × 128 version of the existing newspaper mark
- Editorial screenshot: `assets/qfp-editorial-1280x800.png`, showing the default story list
- Display screenshot: `assets/qfp-display-1280x800.png`, showing the typeface and coordinated size controls
- Compact screenshot: `assets/qfp-compact-1280x800.png`, showing a denser headline-focused presentation
- Small promotional tile: `assets/promo-small-440x280.png`, rendered from `promo-small.svg`

All PNG dimensions are checked by `scripts/validate-qfp-store-assets.mjs`. Recreate the QFP release package with `npm run release:qfp` and use its staging directory for final smoke testing.

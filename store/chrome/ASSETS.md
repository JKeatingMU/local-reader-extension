# Chrome Web Store Assets

The store submission uses authentic Local Reader UI and the existing project icon.

- Store icon: `icons/icon-128-store.png`, a 128 x 128 PNG with the existing mark padded for the store
- Light and dark screenshots: 1280 x 800 PNG, captured from the packaged 2.4.0 reader against a synthetic article
- Small promotional tile: 440 x 280 PNG, rendered from `promo-small.svg`

The synthetic article avoids publishing third-party article text in marketing materials. Recreate the release package with `npm run release:chrome`, then use the package staging directory when running the screenshot test.

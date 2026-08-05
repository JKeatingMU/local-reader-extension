# Try Local Reader in Safari

Safari 26 on macOS can load the extension folder temporarily, without creating an Xcode project first.

1. Open **Safari > Settings**.
2. Open **Advanced** and enable **Show features for web developers**.
3. Open the newly available **Developer** settings tab.
4. Click **Add Temporary Extension**.
5. Select the `local-reader-extension` folder containing `manifest.json`.
6. Approve Safari's unsigned-extension authentication prompt if it appears.
7. In Safari's **Extensions** settings, make sure **Local Reader** is enabled.
8. Open an ordinary article page and click the Local Reader toolbar button.
9. When Safari asks for website access, allow it for that use or for the website.

Test article extraction, the light/dark theme, text sizing, printing and read aloud. Safari supplies its own voice list, so the available names may differ from Chrome.

Temporary extensions are removed after 24 hours or when Safari quits. Once the Safari behaviour is confirmed, Apple's Safari Web Extension packager can create the macOS app wrapper needed for permanent installation or distribution.

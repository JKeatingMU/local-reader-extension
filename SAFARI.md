# Try Textuary in Safari

Safari 26 on macOS can load the extension folder temporarily, without creating an Xcode project first.

1. Open **Safari > Settings**.
2. Open **Advanced** and enable **Show features for web developers**.
3. Stay in the **Settings** window and open its newly available **Developer** tab. This is separate from the **Develop** menu in Safari's menu bar.
4. Click **Add Temporary Extension**.
5. Select the `local-reader-extension` folder containing `manifest.json`.
6. Approve Safari's unsigned-extension authentication prompt if it appears.
7. In Safari's **Extensions** settings, make sure **Textuary** is enabled.
8. Open an ordinary article page and click the Textuary toolbar button.
9. When Safari asks for website access, allow it for that use or for the website.

Test article extraction, reading time and progress, the Reading style controls, printing and read aloud. Safari supplies its own system voice list, so the available names may differ from Chrome. Natural (Kokoro) voices are experimental and require WebGPU plus compatible Safari extension-module behaviour; if the option is disabled or fails to initialise, select **System** speech.

Temporary extensions are removed after 24 hours or when Safari quits. Once the Safari behaviour is confirmed, Apple's Safari Web Extension packager can create the macOS app wrapper needed for permanent installation or distribution.

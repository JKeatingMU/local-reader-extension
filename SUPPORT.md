# Textuary Support

## Before reporting a problem

1. Confirm that the page is an ordinary `http` or `https` article.
2. Wait for the article to finish loading, then activate Textuary again.
3. Confirm that Textuary has permission to access the current website.
4. In Chrome, reload the extension from `chrome://extensions` after installing an updated unpacked version.
5. Remember that a reader can process only content delivered to the browser.

## Natural and Premium voice troubleshooting

- Natural (Kokoro) speech requires a WebGPU-capable Chrome browser and graphics adapter.
- The first activation downloads and caches approximately 330 MB of model data. Check the internet connection and allow time for the progress message to complete.
- The first passage is slower than later passages. Performance varies by GPU; Textuary prepares one passage ahead to reduce pauses.
- If Natural speech fails, open **Voice** and switch **Speech engine** to **System**. Article reading and system read-aloud do not depend on the Kokoro model.
- **Premium (Apple)** requires the packaged Safari extension from `safari/Textuary/Textuary.xcodeproj`; it is unavailable in a temporary folder-loaded extension.
- Install an Enhanced or Premium voice in the device's Accessibility speech settings before opening Textuary. If it does not appear, close and reopen the reader after the download completes.
- If the native bridge is unavailable, disable any duplicate temporary Textuary entry, enable the packaged extension in Safari Settings, and try again. **System** remains available as a fallback.

## Local Library troubleshooting

- Open **Actions** and choose **Save article** in the reading view; **Saved ✓** confirms that the clean snapshot was written to local extension storage. Use the separate **Library** navigation button to view saved articles.
- The saved prose is available offline. Pictures and video remain externally hosted in version 2.8 and need a connection.
- The Library restores the last recorded reading position and marks an article finished when its progress reaches the end.
- The Library temporarily replaces the reader in the same browser tab. Choose **Return to article** in the Library header to restore that reader; the button remains available when the saved list is empty.
- Pausing read-aloud on a saved article remembers the current short passage. After reloading or reopening that snapshot, **Resume aloud** restarts at the beginning of that passage. **Stop** deliberately resets speech to the beginning.
- Use the per-article **Delete** button or **Clear library** to remove saved content. Removing the extension or clearing its browser data may also erase the Library.
- An open reader updates its **Saved ✓** state when its snapshot is deleted or the Library is cleared; switch back to the reader tab if the browser has not already focused it.
- Chrome and Safari keep separate local libraries. Textuary does not yet synchronise saved articles between browsers or devices.

## Report an issue

Use the [GitHub issue tracker](https://github.com/JKeatingMU/local-reader-extension/issues) and include:

- Textuary version
- browser and browser version
- operating system
- public article URL, if it is safe to share
- what you expected and what happened
- a screenshot, if useful and free of private information

Do not post account details, private article text, authentication information or other sensitive data.

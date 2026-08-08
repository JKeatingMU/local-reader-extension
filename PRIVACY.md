# Textuary Privacy Policy

Effective date: 8 August 2026

Textuary turns the article in the browser's current tab into a calm reading view. Its privacy model is deliberately simple: article processing happens locally in the browser, and the developer does not collect, receive or sell browsing data or article content.

## Information the extension processes

When the user activates Textuary, the extension temporarily processes the contents and URL of the active browser tab. It uses that information only to identify, sanitise and display the article selected by the user.

Textuary may request the original HTML of that same active page so it can compare the rendered document with the page response and select the more complete article representation. The request is made by the user's browser to the page the user already opened.

System read aloud uses the speech-synthesis service and voices supplied by the browser and operating system.

If the user explicitly enables Natural voices, Textuary downloads the Kokoro FP32 model and selected voice data from Hugging Face and caches those files in the browser. The packaged Kokoro runtime generates speech locally with WebGPU. Article text, article URLs and the generated audio are not sent to Hugging Face or another speech service. As with any file download, Hugging Face and its delivery infrastructure receive ordinary network request information such as the user's IP address and browser request metadata.

In the packaged Safari version, Premium (Apple) speech passes short article passages from the Safari extension to Textuary's containing application extension, which speaks them through Apple's `AVSpeechSynthesizer` using an Enhanced or Premium voice installed by the user. Synthesis occurs on the Apple device; Textuary does not send the text to the developer, Hugging Face or another remote speech service.

## Collection, transmission and sharing

Textuary does not:

- transmit article text, page URLs or browsing activity to the developer
- use analytics, advertising, tracking pixels or telemetry
- create a developer-operated user account
- sell or share user data
- load executable code from a remote server; the optional remotely downloaded Kokoro files are model and voice data interpreted by the packaged local runtime

Textuary stores reading preferences locally through the browser's extension storage. These preferences can include the selected theme, typeface, text size, line spacing, column width, speech engine, voice, speech speed and whether the user accepted the Natural-voice model download. The browser may separately cache downloaded Kokoro model and voice data.

Textuary saves an article only when the user explicitly chooses **Save article**. The clean article HTML, title, description, author, publication date, source URL, reading estimate, saved time, read/unread state and reading position are then kept in that browser's local extension storage. Saved articles are not uploaded or synchronised by Textuary. The Library shows approximate storage use and provides controls to delete individual articles or clear the entire library. In version 2.8, clean text is available offline while externally hosted images and video may still require a connection.

Articles that are not explicitly saved exist only in the active tab and are discarded when that page is closed, reloaded or returned to its original view.

## Browser permissions

Textuary requests only these extension permissions:

- `activeTab` provides temporary access to the current page after the user clicks the extension or invokes its shortcut.
- `scripting` allows the packaged article extraction, sanitisation and reader code to run in that active tab.
- `storage` remembers reading and speech preferences and holds articles the user explicitly saves in the local Library.
- `nativeMessaging` appears only in the packaged Safari manifest and carries speech commands and the current short passage between Textuary's Safari extension and its own Apple application extension.

The extension does not request persistent access to every website or access to browser history.

## Included software

Mozilla Readability, DOMPurify, Kokoro.js, Transformers.js and the phonemizer runtime are packaged with the extension. They run locally and are not loaded from a remote content-delivery service. Optional Kokoro model and voice data are downloaded from Hugging Face only after Natural voices are enabled.

The browser may include extension storage in its own device backup or synchronisation facilities. Textuary itself uses local storage rather than the browser's sync-storage API and does not operate a cloud account or synchronisation service.

## Contact

Questions or concerns can be submitted through the public [Textuary issue tracker](https://github.com/JKeatingMU/local-reader-extension/issues).

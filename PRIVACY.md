# Textuary Privacy Policy

Effective date: 7 August 2026

Textuary turns the article in the browser's current tab into a calm reading view. Its privacy model is deliberately simple: article processing happens locally in the browser, and the developer does not collect, receive or sell browsing data or article content.

## Information the extension processes

When the user activates Textuary, the extension temporarily processes the contents and URL of the active browser tab. It uses that information only to identify, sanitise and display the article selected by the user.

Textuary may request the original HTML of that same active page so it can compare the rendered document with the page response and select the more complete article representation. The request is made by the user's browser to the page the user already opened.

System read aloud uses the speech-synthesis service and voices supplied by the browser and operating system.

If the user explicitly enables Natural voices, Textuary downloads the Kokoro FP32 model and selected voice data from Hugging Face and caches those files in the browser. The packaged Kokoro runtime generates speech locally with WebGPU. Article text, article URLs and the generated audio are not sent to Hugging Face or another speech service. As with any file download, Hugging Face and its delivery infrastructure receive ordinary network request information such as the user's IP address and browser request metadata.

## Collection, transmission and sharing

Textuary does not:

- transmit article text, page URLs or browsing activity to the developer
- use analytics, advertising, tracking pixels or telemetry
- create a developer-operated user account
- sell or share user data
- load executable code from a remote server; the optional remotely downloaded Kokoro files are model and voice data interpreted by the packaged local runtime

Version 2.6.0 stores reading preferences locally through the browser's extension storage. These preferences can include the selected theme, typeface, text size, line spacing, column width, speech engine, voice, speech speed and whether the user accepted the Natural-voice model download. The browser may separately cache downloaded Kokoro model and voice data. Textuary does not save article content, URLs, browsing history, reading progress or reading activity. Extracted content exists only in the active tab and is discarded when that page is closed, reloaded or returned to its original view.

## Browser permissions

Textuary requests only these extension permissions:

- `activeTab` provides temporary access to the current page after the user clicks the extension or invokes its shortcut.
- `scripting` allows the packaged article extraction, sanitisation and reader code to run in that active tab.
- `storage` remembers reading and speech preferences locally in the browser.

The extension does not request persistent access to every website or access to browser history.

## Included software

Mozilla Readability, DOMPurify, Kokoro.js, Transformers.js and the phonemizer runtime are packaged with the extension. They run locally and are not loaded from a remote content-delivery service. Optional Kokoro model and voice data are downloaded from Hugging Face only after Natural voices are enabled.

## Future changes

If a future release adds saved articles or offline reading, this policy and the relevant store disclosures will be updated before that version is published. Local storage will not be represented as cloud collection or transmission.

## Contact

Questions or concerns can be submitted through the public [Textuary issue tracker](https://github.com/JKeatingMU/local-reader-extension/issues).

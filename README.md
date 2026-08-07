# Textuary — Article Reader & Text Sanctuary

A browser extension for Chrome and Safari that turns articles into a calm, focused text sanctuary. Textuary combines generic article extraction with estimated reading time, live progress, remembered typography and themes, and private read-aloud. Chrome offers optional Kokoro natural voices generated locally with WebGPU. Version 2.7 adds a native Safari bridge for Apple's installed Enhanced and Premium voices on macOS, iPhone and iPad. Textuary does not transmit article text to a reading or analytics service and does not collect browsing data.

## Install in Chrome

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this `local-reader-extension` folder.
5. Open Chrome's Extensions menu (the puzzle-piece icon) and pin **Textuary**.

If an earlier version is already loaded, open `chrome://extensions` and click its reload button. Chrome will update it to **Textuary 2.7.1**.

## Try in Safari on macOS

Textuary now includes an Xcode project for the permanent Safari Web Extension container and its native Apple Premium-voice bridge. Follow [the Safari installation and test instructions](SAFARI.md). A reader-only temporary-extension option remains available, but Premium voices require the packaged application.

## Use

1. Open an article on any ordinary `http` or `https` page and wait for it to load.
2. Click the **Textuary** toolbar icon, or press **Option+Shift+R** on macOS (**Alt+Shift+R** elsewhere).
3. Choose **System** speech for voices exposed by the browser; in Chrome choose **Natural (Kokoro)** for locally generated speech; or in the packaged Safari version choose **Premium (Apple)** for installed Apple Enhanced and Premium voices. Then choose a **Voice** and **Speed**. Click **Read aloud**; the same button pauses or resumes, and **Stop** returns to the beginning.
4. On the first use of Natural voices in Chrome, Textuary explains and asks permission for an approximately 330 MB model download from Hugging Face. The model and selected voice data are cached by the browser; article text remains on the device. Natural voices require WebGPU and automatically give way to System speech when it is unavailable.
5. Open **Reading style** to choose the paper, evening or automatic ambient theme; select a typeface; and adjust text size, spacing and column width. Textuary remembers these choices locally.
6. Follow the slim progress bar and estimated time remaining while reading. During read-aloud, the current passage is highlighted automatically.
7. Use **Print** for clean paper or PDF output, or click **Original page** to return to the normal site.

The extension requests `activeTab` and `scripting` for the article you choose, plus `storage` to remember reader settings locally. It has no persistent access to browsing history or other sites.

## How it works

Textuary first clones the fully rendered page and runs the same kind of content-density analysis used by browser reader modes. It also examines an inertly parsed copy of the page's original HTML to improve reliability on dynamic sites, then uses the stronger article candidate.

Mozilla Readability identifies the headline, author, publication time and core article content. DOMPurify sanitizes the selected result before the extension renders it locally. The extra request is made only to the page already open in the tab; extracted article text is not sent elsewhere.

System read-aloud uses the browser's built-in Web Speech support and the voices it exposes from the computer. Optional Natural read-aloud in Chrome uses the packaged Kokoro.js and Transformers.js runtime with Kokoro's GPU-optimised FP32 model. The model and small selected-voice file are downloaded as data from Hugging Face after consent, then speech is generated locally using WebGPU. The packaged Safari extension instead sends short passages to Apple's on-device `AVSpeechSynthesizer`, allowing it to use Enhanced and Premium voices installed by the user. Article text is not sent to a remote speech service by either mode.

Read-aloud starts with the title, author and publication date when available, followed by the standfirst and article. Text is divided into short passages; Natural speech prepares the next passage while the current one plays.

Readability 0.6.0, DOMPurify 3.4.13, the Kokoro.js 1.2.1 browser runtime and its matching ONNX WebAssembly helper are included in the `vendor` folder; no remote executable code is loaded. Their licences and the licences of the packaged Kokoro browser dependencies are included alongside them.

See the [privacy policy](PRIVACY.md) and [support guide](SUPPORT.md) for the public store disclosures and help information.

Chrome Web Store preparation materials are under [`store/chrome`](store/chrome), including the draft listing, approved-size artwork and submission checklist.

## Troubleshooting

- If the extension shows `WEB` on its icon, the current tab is not an ordinary web page—for example, it may be a browser settings page.
- If Textuary cannot identify a complete article, wait for the article to finish loading and click the icon again.
- The System voice menu is supplied by the browser and operating system; Chrome and Safari may expose different lists. Safari's Premium menu contains only installed Apple Enhanced and Premium voices.
- Natural voices require WebGPU in Chrome. Safari uses the native Apple voice bridge because ONNX Runtime's Safari WebGPU path can hang. The first Chrome model load and passage take longer; generation speed depends on the computer's GPU.
- A reader can only process text delivered to the browser. Content that is never present in the rendered page cannot be extracted.
- After changing extension files, open `chrome://extensions` and click the extension's reload button.

## Versions and development

See [the store-publishing and product roadmap](STORE_PUBLISHING_ROADMAP.md) for the planned Chrome Web Store and Safari App Store releases and the proposed reading-experience, offline-library and export features.

- `v1.0.0` is the preserved Daily Mail-specific implementation.
- `v2.0.0` introduced the generic Local Reader implementation.
- `v2.1.0` adds comparison with the original page HTML for more resilient extraction.
- `v2.2.0` adds private, native read-aloud controls with pause, resume and stop.
- `v2.3.0` adds selectors for the available Chrome voices and playback speed.
- `v2.3.1` widens the desktop reader and keeps its full toolbar on one line in a standard desktop window.
- `v2.4.0` adds Chrome/Safari API compatibility and Safari-friendly speech startup.
- `v2.5.0` introduces the Textuary name, reading-time and progress estimates, remembered typography and themes, automatic ambient mode, and read-aloud passage highlighting.
- `v2.6.0` adds optional on-device Kokoro natural voices, consented model caching, WebGPU playback with passage prefetch, system fallback, and spoken author/date metadata.
- `v2.6.1` packages Kokoro's matching ONNX runtime locally for Chrome Manifest V3 compatibility.
- `v2.6.2` makes Kokoro's pronunciation-dictionary stream compatible with Safari 26.
- `v2.6.3` normalises Safari's decompressed pronunciation dictionary to an `ArrayBuffer`.
- `v2.6.4` keeps Safari on reliable System speech after testing exposed an upstream ONNX WebGPU hang.
- `v2.7.0` adds the packaged macOS/iOS Safari extension and on-device Apple Enhanced/Premium voice support with Textuary's existing controls and passage highlighting.
- `v2.7.1` improves complete-headline selection, promotes lazy-loaded article images, preserves safe native video, and removes player-interface text from the reading view.

The project is a Git repository. To inspect the preserved version without changing the working tree, run `git show v1.0.0:reader.js` from this folder.

Development dependencies are only needed to refresh the vendored libraries:

```sh
npm install
npm run vendor
npm run check
npm run release:chrome
```

`npm run release:chrome` validates the project and creates an allowlisted Chrome Web Store package under `dist/chrome`.

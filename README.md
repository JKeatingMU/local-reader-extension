# Textuary — Article Reader & Text Sanctuary

A browser extension for Chrome and Safari that turns articles into a calm, focused text sanctuary. Textuary combines generic article extraction with estimated reading time, live progress, remembered typography and themes, and private read-aloud using the voices already available on your computer. It does not transmit article text to an external reading or analytics service and does not collect browsing data.

## Install in Chrome

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this `local-reader-extension` folder.
5. Open Chrome's Extensions menu (the puzzle-piece icon) and pin **Textuary**.

If an earlier version is already loaded, open `chrome://extensions` and click its reload button. Chrome will update it to **Textuary 2.5.0**.

## Try in Safari on macOS

Safari 26 can load this same folder temporarily for development testing. Follow [the Safari test instructions](SAFARI.md). Safari removes a temporary extension when it quits or after 24 hours; permanent packaging can be added after the compatibility test.

## Use

1. Open an article on any ordinary `http` or `https` page and wait for it to load.
2. Click the **Textuary** toolbar icon, or press **Option+Shift+R** on macOS (**Alt+Shift+R** elsewhere).
3. Choose a **Voice** and **Speed**, then click **Read aloud**. The same button pauses or resumes, and **Stop** returns to the beginning. Changes made during playback apply from the next short passage.
4. Open **Reading style** to choose the paper, evening or automatic ambient theme; select a typeface; and adjust text size, spacing and column width. Textuary remembers these choices locally.
5. Follow the slim progress bar and estimated time remaining while reading. During read-aloud, the current passage is highlighted automatically.
6. Use **Print** for clean paper or PDF output, or click **Original page** to return to the normal site.

The extension requests `activeTab` and `scripting` for the article you choose, plus `storage` to remember reader settings locally. It has no persistent access to browsing history or other sites.

## How it works

Textuary first clones the fully rendered page and runs the same kind of content-density analysis used by browser reader modes. It also examines an inertly parsed copy of the page's original HTML to improve reliability on dynamic sites, then uses the stronger article candidate.

Mozilla Readability identifies the headline, author, publication time and core article content. DOMPurify sanitizes the selected result before the extension renders it locally. The extra request is made only to the page already open in the tab; extracted article text is not sent elsewhere.

Read aloud uses the browser's built-in Web Speech support and the voices it exposes from the computer. The article is divided into short passages for reliable playback; no external speech or analytics service is added by Textuary.

Readability 0.6.0 and DOMPurify 3.4.13 are included in the `vendor` folder; no remote code is loaded. Their licences are included alongside them.

See the [privacy policy](PRIVACY.md) and [support guide](SUPPORT.md) for the public store disclosures and help information.

Chrome Web Store preparation materials are under [`store/chrome`](store/chrome), including the draft listing, approved-size artwork and submission checklist.

## Troubleshooting

- If the extension shows `WEB` on its icon, the current tab is not an ordinary web page—for example, it may be a browser settings page.
- If Textuary cannot identify a complete article, wait for the article to finish loading and click the icon again.
- The voice menu is supplied by the browser and operating system; Chrome and Safari may expose different voice lists.
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

The project is a Git repository. To inspect the preserved version without changing the working tree, run `git show v1.0.0:reader.js` from this folder.

Development dependencies are only needed to refresh the vendored libraries:

```sh
npm install
npm run vendor
npm run check
npm run release:chrome
```

`npm run release:chrome` validates the project and creates an allowlisted Chrome Web Store package under `dist/chrome`.

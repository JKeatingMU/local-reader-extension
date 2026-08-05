# Local Reader for Chrome

A private, local Chrome extension that turns articles already loaded in the browser into a clean reader view. It uses Mozilla Readability to identify the main text generically, so it does not depend on publisher-specific CSS selectors. It does not contact another service, download article copies, or collect browsing data.

## Install once

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this `dailymail-reader-extension` folder. The original folder name has been retained so existing installations can be reloaded in place.
5. Open Chrome's Extensions menu (the puzzle-piece icon) and pin **Local Reader**.

If version 1 was already loaded, open `chrome://extensions` and click its reload button. Chrome will update it to **Local Reader 2.0.0**.

## Use

1. Open an article on any ordinary `http` or `https` page and wait for it to load.
2. Click the **Local Reader** toolbar icon, or press **Option+Shift+R** on macOS (**Alt+Shift+R** elsewhere).
3. Use the controls at the top to change text size, switch between light and dark themes, or print.
4. Click **Original page** to return to the normal site.

The extension only requests `activeTab` and `scripting`. Chrome grants temporary access to the current tab when you click the extension; it has no persistent access to browsing history or other sites.

## How it works

Local Reader clones the fully rendered page and runs the same kind of content-density analysis used by browser reader modes. Mozilla Readability identifies the headline, author, publication time and core article content. DOMPurify sanitizes the result before the extension renders it locally.

Readability 0.6.0 and DOMPurify 3.4.13 are included in the `vendor` folder; no remote code is loaded. Their licences are included alongside them.

## Troubleshooting

- If Chrome shows `WEB` on the extension icon, the current tab is not an ordinary web page—for example, it may be a `chrome://` settings page.
- If Local Reader cannot identify a complete article, wait for the article to finish loading and click the icon again.
- A reader can only process text delivered to the browser. Content that is never present in the rendered page cannot be extracted.
- After changing extension files, open `chrome://extensions` and click the extension's reload button.

## Versions and development

- `v1.0.0` is the preserved Daily Mail-specific implementation.
- `v2.0.0` is the current generic Local Reader implementation.

The project is a Git repository. To inspect the preserved version without changing the working tree, run `git show v1.0.0:reader.js` from this folder.

Development dependencies are only needed to refresh the vendored libraries:

```sh
npm install
npm run vendor
npm run check
```

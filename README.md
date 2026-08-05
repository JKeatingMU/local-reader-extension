# Daily Mail Reader for Chrome

A small, local Chrome extension that turns a Daily Mail article already loaded in the browser into a clean reader view. It does not contact another service, download article copies, or collect browsing data.

## Install once

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this `dailymail-reader-extension` folder.
5. Open Chrome's Extensions menu (the puzzle-piece icon) and pin **Daily Mail Reader**.

## Use

1. Open a Daily Mail article and wait for the page to load.
2. Click the **Daily Mail Reader** toolbar icon, or press **Option+Shift+R** on macOS (**Alt+Shift+R** elsewhere).
3. Use the controls at the top to change text size, switch between light and dark themes, or print.
4. Click **Original page** to return to the normal site.

The extension only requests `activeTab` and `scripting`. Chrome grants temporary access to the current tab when you click the extension; it has no persistent access to browsing history or other sites.

## Troubleshooting

- If Chrome shows `DM` on the extension icon, the current tab is not a `dailymail.com` page.
- If the reader says the article has not loaded, wait a moment and click the icon again.
- After changing the extension files, open `chrome://extensions` and click the extension's reload button.

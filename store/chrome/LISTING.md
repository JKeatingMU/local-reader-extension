# Chrome Web Store Listing

Prepared for Textuary 2.5.0.

## Product details

**Name:** Textuary — Article Reader & Text Sanctuary

**Summary:** Read and listen to articles in a calm text sanctuary with progress, typography controls and private read-aloud.

**Category:** Productivity

**Language:** English

### Detailed description

Textuary transforms the article in your current tab into a calm, distraction-free text sanctuary.

Features:

- clean article extraction without publisher-specific rules
- estimated reading time, live progress and time remaining
- four typefaces plus adjustable text size, spacing and column width
- paper, evening and automatic ambient themes
- locally remembered reading preferences
- read aloud using voices already available through Chrome and your computer
- selectable voice and playback speed
- pause, resume and stop controls
- automatic highlighting of the passage being read aloud
- clean printing and PDF output
- a keyboard shortcut for quick access

Textuary runs only when you activate it. Article extraction and sanitisation happen locally in the browser. Reading and speech preferences are saved only in browser extension storage. Textuary contains no advertising, analytics or external reading service, and it does not transmit article text or browsing activity to the developer.

Some pages do not deliver their complete article to the browser. Textuary can reorganise content that is available in the page, but it cannot retrieve text that was never delivered.

## Single purpose

Transform the article in the user-selected active tab into a clean local reading view and provide reading controls for that article.

## Permission justifications

### `activeTab`

Provides temporary access to the current article only after the user clicks Textuary or invokes its keyboard shortcut. This avoids persistent access to all websites.

### `scripting`

Runs the packaged Readability, DOMPurify and Textuary code in the user-selected active tab to identify, sanitise and display the article.

### `storage`

Remembers the user's selected theme, typography, voice and speech speed locally. It does not store article content, URLs, browsing history or reading activity.

## Privacy declarations

- Website content and the active page URL are processed locally solely to provide the reader feature requested by the user.
- Theme, typography, voice and speech-speed preferences are stored locally through browser extension storage.
- No article content, URLs or browsing activity are transmitted to the developer or a third party.
- No data is sold or used for advertising, creditworthiness or purposes unrelated to the extension's single purpose.
- No remotely hosted executable code is used.
- Privacy policy: <https://github.com/JKeatingMU/local-reader-extension/blob/main/PRIVACY.md>

The dashboard wording may change. Ensure its selected data categories describe local processing consistently with the privacy policy rather than implying that the developer receives the data.

## URLs

- Homepage: <https://github.com/JKeatingMU/local-reader-extension>
- Support: <https://github.com/JKeatingMU/local-reader-extension/blob/main/SUPPORT.md>
- Issue tracker: <https://github.com/JKeatingMU/local-reader-extension/issues>

## Distribution

- Visibility: Public
- Regions: All supported regions
- Pricing: Free
- Mature content: No
- Deferred publishing: Recommended for the first submission

## Reviewer test instructions

1. Install the extension.
2. Open a substantial public article over `https` and wait for it to load.
3. Click the Textuary toolbar button.
4. Confirm that the page becomes a clean article view.
5. Test the reading-time display, progress bar, Reading style controls, printing and read-aloud highlighting.
6. Click **Original page** to restore the source page.

No account or test credentials are required.

## Required assets

- `../../icons/icon-128-store.png` — padded 128 x 128 store icon
- `assets/reader-light-1280x800.png` — primary product screenshot
- `assets/reader-dark-1280x800.png` — dark-theme product screenshot
- `assets/promo-small-440x280.png` — small promotional tile

See [the submission checklist](SUBMISSION_CHECKLIST.md) for the remaining account and Windows-test steps.

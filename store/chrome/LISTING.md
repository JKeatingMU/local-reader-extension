# Chrome Web Store Listing

Prepared for Local Reader 2.4.0.

## Product details

**Draft name:** Local Reader

**Name decision:** A different Chrome Web Store product currently begins its title with “Local Reader”. Choose a sufficiently distinctive final store name before submission; do not change the extension identity silently during packaging.

**Summary:** Read articles in a clean, focused layout with themes, text controls and private read-aloud.

**Category:** Productivity

**Language:** English

### Detailed description

Local Reader transforms the article in your current tab into a calm, distraction-free reading view.

Features:

- clean article extraction without publisher-specific rules
- comfortable typography in a focused reading column
- light and dark reading themes
- adjustable text size
- read aloud using voices already available through Chrome and your computer
- selectable voice and playback speed
- pause, resume and stop controls
- clean printing and PDF output
- a keyboard shortcut for quick access

Local Reader runs only when you activate it. Article extraction and sanitisation happen locally in the browser. The extension contains no advertising, analytics or external reading service, and it does not transmit article text or browsing activity to the developer.

Some pages do not deliver their complete article to the browser. Local Reader can reorganise content that is available in the page, but it cannot retrieve text that was never delivered.

## Single purpose

Transform the article in the user-selected active tab into a clean local reading view and provide reading controls for that article.

## Permission justifications

### `activeTab`

Provides temporary access to the current article only after the user clicks Local Reader or invokes its keyboard shortcut. This avoids persistent access to all websites.

### `scripting`

Runs the packaged Readability, DOMPurify and Local Reader code in the user-selected active tab to identify, sanitise and display the article.

## Privacy declarations

- Website content and the active page URL are processed locally solely to provide the reader feature requested by the user.
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
3. Click the Local Reader toolbar button.
4. Confirm that the page becomes a clean article view.
5. Test text sizing, theme switching, printing and the read-aloud controls.
6. Click **Original page** to restore the source page.

No account or test credentials are required.

## Required assets

- `../../icons/icon-128-store.png` — padded 128 x 128 store icon
- `assets/reader-light-1280x800.png` — primary product screenshot
- `assets/reader-dark-1280x800.png` — dark-theme product screenshot
- `assets/promo-small-440x280.png` — small promotional tile

See [the submission checklist](SUBMISSION_CHECKLIST.md) for the remaining account, naming and Windows-test steps.

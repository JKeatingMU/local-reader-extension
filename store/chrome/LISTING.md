# Chrome Web Store Listing

Prepared for Textuary 2.8.0 release validation; confirm the final dashboard rendering before submission.

## Product details

**Name:** Textuary — Article Reader & Text Sanctuary

**Summary:** Read, listen to and save articles in a calm text sanctuary with private read-aloud and an account-free local Library.

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
- choose system voices or optional natural Kokoro voices generated locally with WebGPU
- selectable voice and playback speed
- pause, resume and stop controls
- automatic highlighting of the passage being read aloud
- an account-free local Library with offline clean-text snapshots
- Library search, read/unread controls and restored reading and read-aloud positions
- same-tab return from the Library without duplicate article tabs
- clean printing and PDF output using the selected reader typeface
- a keyboard shortcut for quick access

Textuary runs only when you activate it. Article extraction and sanitisation happen locally in the browser. Reading and speech preferences are saved in local browser extension storage. An article snapshot, its original URL and reading state are stored only when the user explicitly chooses Save article; Textuary does not upload or synchronise the Library. If the user enables Natural voices, the browser downloads and caches approximately 330 MB of model data from Hugging Face; the packaged runtime still generates speech locally and never transmits article text. Textuary contains no advertising or analytics and does not transmit article text or browsing activity to the developer.

Some pages do not deliver their complete article to the browser. Textuary can reorganise content that is available in the page, but it cannot retrieve text that was never delivered.

## Single purpose

Transform an article in the user-selected active tab into a clean local reading view with reading, listening, printing and explicitly requested local saving controls.

## Permission justifications

### `activeTab`

Provides temporary access to the current article only after the user clicks Textuary or invokes its keyboard shortcut. This avoids persistent access to all websites.

### `scripting`

Runs the packaged Readability, DOMPurify and Textuary code in the user-selected active tab to identify, sanitise and display the article.

### `storage`

Stores the user's selected theme, typography, speech engine, voice, speech speed and Natural-voice consent locally. It also holds clean article snapshots, original URLs and reading state only for articles the user explicitly saves in the local Library. Textuary does not use browser sync storage and does not collect browsing history.

## Privacy declarations

- Website content and the active page URL are processed locally solely to provide the reader feature requested by the user.
- Theme, typography, voice and speech-speed preferences are stored locally through browser extension storage.
- Clean article HTML, its original URL, metadata and reading state are stored locally only after the user explicitly chooses **Save article**. Saved entries are not uploaded or synchronised by Textuary and can be individually deleted or cleared from the Library.
- No article content, URLs or browsing activity are transmitted to the developer or a speech service. After opt-in, ordinary model-file requests are made to Hugging Face without article text.
- No data is sold or used for advertising, creditworthiness or purposes unrelated to the extension's single purpose.
- No remotely hosted executable code is used. Kokoro model and voice files are downloaded data interpreted by the packaged runtime.
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
5. Test the reading-time display, floating time remaining, progress bar, Reading style controls, Voice popover, printing and read-aloud highlighting.
6. Open **Actions**, choose **Save article**, then open **Library** and confirm the saved article appears.
7. Choose **Return to article** and confirm the reader returns in the same tab.
8. Click **Original page** to restore the source page.

No account or test credentials are required.

## Required assets

- `../../icons/icon-128-store.png` — padded 128 x 128 store icon
- `assets/reader-light-1280x800.png` — primary product screenshot
- `assets/reader-dark-1280x800.png` — dark-theme product screenshot
- `assets/reader-voice-1280x800.png` — voice and speed controls
- `assets/library-1280x800.png` — account-free local Library
- `assets/promo-small-440x280.png` — small promotional tile

See [the submission checklist](SUBMISSION_CHECKLIST.md) for the remaining account and Windows-test steps.

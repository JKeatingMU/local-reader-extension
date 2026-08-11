# Chrome Web Store Listing — Quiet Front Page 1.0.0

Confirm the final dashboard rendering and current category choices before submission.

## Product details

**Name:** Quiet Front Page — Clean News Homepages

**Summary:** Turn busy newspaper home and section pages into calm, ordered story lists with original links.

**Category:** Productivity or News & Weather; select the closest current reading/news subcategory shown by the dashboard.

**Language:** English

### Detailed description

Quiet Front Page gives busy newspaper home and section pages room to breathe.

Activate it on the page you are viewing to create a calm, ordered list of likely stories. Headlines, summaries, section labels and available images are arranged into a consistent reading-friendly layout, while every story continues to link to the publisher's original article.

Features:

- identifies likely stories without publisher-specific adapters
- preserves the page's approximate editorial order
- keeps original publisher links
- includes available story images and quiet placeholders when no image is present
- infers useful section labels from article links
- removes duplicate links and leaves out obvious navigation, newsletter and promotional furniture
- Editorial, Book and Clean typefaces
- three coordinated text-and-image sizes
- comfortable, compact and headlines-only views
- detects likely individual articles instead of forcing them into a misleading front-page layout
- toolbar action and keyboard shortcut for quick access

Quiet Front Page runs only when you activate it. The current page is processed locally in the browser. The extension has no account, analytics, advertising, storage, tracking or persistent access to websites. It does not block network requests or use publisher-specific rules.

The result depends on story information already present in the rendered page. Unusual page structures may yield too few stories, and content that has not yet loaded cannot be included. Images remain hosted by their publishers and require a connection.

Quiet Front Page is the discovery companion to Textuary: QFP quietens discovery; Textuary quietens reading. Textuary is optional and is not required to use Quiet Front Page.

## Single purpose

Reformat the newspaper home or section page in the user-selected active tab into a calm, ordered story list that preserves original publisher links.

## Permission justifications

### `activeTab`

Provides temporary access to the current newspaper page only after the user clicks Quiet Front Page or invokes its keyboard shortcut. This avoids persistent access to all websites.

### `scripting`

Runs the packaged Quiet Front Page extraction and display code in the user-selected active tab to identify likely story cards and construct the quiet view.

## Privacy declarations

- The active page URL and rendered website content are processed ephemerally and locally solely to provide the user-requested quiet view.
- No page content, URLs, browsing activity or personal data are transmitted to the developer.
- No information is retained by the extension after the page is closed or reloaded.
- No analytics, advertising, telemetry, affiliate links or tracking are used.
- No data is sold or used for purposes unrelated to the extension's single purpose.
- No remotely hosted executable code is used.
- Privacy policy: <https://github.com/JKeatingMU/local-reader-extension/blob/main/QUIET_FRONT_PAGE_PRIVACY.md>

The dashboard wording may change. If it asks which information the extension *handles* rather than what the developer *collects*, disclose **Web history** and **Website content** for the selected active tab, then state clearly that both are processed locally, are not retained and are not transmitted.

## URLs

- Homepage: <https://github.com/JKeatingMU/local-reader-extension/tree/main/prototypes/quiet-front-page>
- Support: <https://github.com/JKeatingMU/local-reader-extension/blob/main/QUIET_FRONT_PAGE_SUPPORT.md>
- Issue tracker: <https://github.com/JKeatingMU/local-reader-extension/issues>

## Distribution

- Visibility: Public
- Regions: All supported regions
- Pricing: Free
- Mature content: No
- Deferred publishing: Recommended for the first submission

## Reviewer test instructions

1. Install the extension; no account or credentials are required.
2. Open a public newspaper home or section page over `https` and wait for its initial stories to load.
3. Click the Quiet Front Page toolbar button.
4. Confirm that the page becomes an ordered image-and-headline story list whose links point to the original publication.
5. Open **Display** and test the typeface and size controls.
6. Test **Headlines only** and **Compact view**.
7. Choose **Original page** to reload the publisher's page.
8. Optionally activate Quiet Front Page on an individual article and confirm it shows an article-page explanation rather than a misleading story list. Textuary does not need to be installed; choose **Continue on original page** to dismiss the explanation.

## Required assets

- `assets/store-icon-128.png` — 128 × 128 store icon
- `assets/qfp-editorial-1280x800.png` — primary quiet front-page screenshot
- `assets/qfp-display-1280x800.png` — typeface and size controls
- `assets/qfp-compact-1280x800.png` — compact/headline-focused layout
- `assets/promo-small-440x280.png` — small promotional tile

See [the submission checklist](SUBMISSION_CHECKLIST.md) for the remaining Windows and account-side steps.

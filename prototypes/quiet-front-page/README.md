# Quiet Front Page — Textuary Lab

This is an isolated local prototype for cleaning newspaper home and section pages into an ordered visual story list. It does not alter the submitted Textuary 2.8 Chrome package.

## Install locally in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `prototypes/quiet-front-page` directory.
5. Pin **Quiet Front Page — Textuary Lab**.

Open a newspaper home or section page and click the prototype's toolbar button. Click it a second time, or choose **Original page**, to reload the publisher's page.

## Install locally in Safari on macOS

1. Open `safari/QuietFrontPage/Quiet Front Page/Quiet Front Page.xcodeproj` from the repository root.
2. In Xcode, select the **Quiet Front Page (macOS)** scheme and **My Mac** as the destination.
3. Press **Run**. The small Quiet Front Page containing app will open.
4. Choose **Quit and Open Safari Extensions Preferences…** in that app.
5. In Safari's extension settings, enable **Quiet Front Page** and allow it access to the website you are viewing when Safari asks.
6. Open a newspaper home or section page and click the Quiet Front Page toolbar button.

The generated Xcode project also contains an iOS/iPadOS target. That target is available for later physical-device testing, but macOS Safari is the currently verified local setup. Xcode may need to remain installed, but it does not need to remain open after the locally signed app has been run and the extension enabled.

The Chrome and Safari versions use only `activeTab` and `scripting`. They have no persistent site access, storage, analytics, request blocking or publisher-specific adapters.

## Current experiment

- identify repeated story cards from headings, links, images and semantic containers
- preserve the source page's approximate editorial order
- restrict links to the current publication host
- resolve ordinary and lazy-loaded images
- remove duplicate story URLs and obvious navigation, advertising and newsletter furniture
- use a denser default layout with comfortable and compact reading options
- offer Editorial, Book and Clean typefaces plus three coordinated text-and-image sizes for the current view
- give image-less stories a quiet newspaper placeholder so the list keeps its visual rhythm
- label each selected story with a section inferred from its original publisher URL
- pair empty full-card overlay links with a single credible sibling headline in the same bounded story card
- detect likely individual articles before extraction and offer a Textuary hand-off instead

Story links open the publisher's original article. When Quiet Front Page is invoked directly on a likely article, it asks the reader to press `Option+Shift+R` on macOS or `Alt+Shift+R` elsewhere, or click Textuary in the browser toolbar. The hand-off automatically disappears when Textuary opens.

## Known limits

- The result depends on story information already present in the rendered page.
- Homepages with unusual markup may yield too few stories or include an occasional promotional card.
- Cross-subdomain story links are deliberately excluded in this first conservative prototype.
- Infinite-scroll stories that have not yet been loaded are not included.
- External images still require a connection.
- Browser security prevents one extension from programmatically pressing another extension's toolbar action, so the Textuary hand-off requires its shortcut or toolbar button.

The local demonstration pages are `demo/news-homepage.html` and `demo/article-page.html`.

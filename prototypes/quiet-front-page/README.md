# Quiet Front Page — Textuary Lab

This is an isolated local prototype for cleaning newspaper home and section pages into an ordered visual story list. It does not alter the submitted Textuary 2.8 Chrome package.

## Install locally in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `prototypes/quiet-front-page` directory.
5. Pin **Quiet Front Page — Textuary Lab**.

Open a newspaper home or section page and click the prototype's toolbar button. Click it a second time, or choose **Original page**, to reload the publisher's page.

The prototype uses only `activeTab` and `scripting`. It has no persistent site access, storage, analytics, request blocking or publisher-specific adapters.

## Current experiment

- identify repeated story cards from headings, links, images and semantic containers
- preserve the source page's approximate editorial order
- restrict links to the current publication host
- resolve ordinary and lazy-loaded images
- remove duplicate story URLs and obvious navigation, advertising and newsletter furniture
- show comfortable, compact and headlines-only reading options

Story links open the publisher's original article. The existing Textuary extension can then provide the full article-reading view.

## Known limits

- The result depends on story information already present in the rendered page.
- Homepages with unusual markup may yield too few stories or include an occasional promotional card.
- Cross-subdomain story links are deliberately excluded in this first conservative prototype.
- Infinite-scroll stories that have not yet been loaded are not included.
- External images still require a connection.

The local demonstration page is `demo/news-homepage.html`.

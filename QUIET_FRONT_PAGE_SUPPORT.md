# Quiet Front Page Support

## Before reporting a problem

1. Confirm that the current tab is an ordinary `http` or `https` newspaper home or section page.
2. Wait for the page's initial stories to finish loading, then activate Quiet Front Page again.
3. Confirm that Quiet Front Page has permission to access the current website.
4. If testing an updated unpacked build in Chrome, reload it from `chrome://extensions`.
5. Remember that Quiet Front Page can organise only story information already delivered in the rendered page.

## Expected behaviour

- Click the toolbar button or use `Alt+Shift+F` (`Option+Shift+F` on macOS) to open the quiet view.
- Choose **Original page**, or activate Quiet Front Page a second time, to reload the publisher's page.
- Story links open the publisher's original articles.
- **Display** changes the typeface and coordinated text/image size for the current view.
- **Headlines only** hides summaries, while **Compact view** reduces the space used by each story.
- Pages that look like individual articles show a hand-off explaining that Quiet Front Page is intended for home and section pages.

## Known limits

- Unusual or heavily scripted page structures may produce too few stories or an occasional promotional card.
- Stories not yet added to an infinite-scroll page cannot be included.
- Cross-subdomain links are conservatively excluded even when they belong to the same publisher group.
- Images remain hosted by their publishers and require a network connection.
- Textuary integration requires the user to invoke Textuary's shortcut or toolbar button; browser security prevents one extension from programmatically activating another.

## Report an issue

Use the [GitHub issue tracker](https://github.com/JKeatingMU/local-reader-extension/issues) and include:

- Quiet Front Page version
- browser and browser version
- operating system
- public newspaper home or section URL, if it is safe to share
- what you expected and what happened
- a screenshot, if useful and free of private information

Do not post account details, authentication information, subscriber-only article text or other sensitive data.

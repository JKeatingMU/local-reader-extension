# Textuary 2.9: Personal Reading Archive

Status: planned after the 2.8 validation and release work

## Purpose

Textuary 2.9 will extend the local Library into a portable personal reading archive. The release is about augmenting saved articles—organising them, adding personal context and exchanging the resulting collection—without changing the core reading experience.

The design remains local-first: no account, cloud service, analytics or automatic synchronisation is required.

## Planned capabilities

### Reading lists

- Create, rename, reorder and delete named reading lists.
- Allow an article to belong to more than one list.
- Keep automatic states such as unread, in progress and finished separate from user-created lists.
- Preserve list membership during every full-fidelity export and import.

### Tags

- Add multiple free-form tags to an article.
- Normalise whitespace and case for matching while preserving a readable display label.
- Filter and search the Library by tag.
- Include tags in XML, JSON, Markdown and OPML exchange where the target format permits it.

### Article notes

- Attach one editable Markdown note to each saved article.
- Search note text alongside titles, authors, publications, lists and tags.
- Include notes in full backups and readable exports.
- Record created and last-updated timestamps.

Passage-level highlights and anchored comments are deliberately deferred. They require a separate text-anchoring design so annotations remain meaningful if extraction changes.

## Import and export formats

### Textuary Library XML

XML will be a first-class, full-fidelity exchange format.

- Use XML 1.0 with UTF-8 encoding and an explicit Textuary schema version.
- Publish an XSD alongside the implementation.
- Preserve original article URLs, titles, authors, publication dates, source names, saved dates, reading state, progress, lists, tags and notes.
- Optionally include the sanitised article snapshot so an imported archive can remain available offline.
- Represent dates in ISO 8601 and use stable identifiers for articles and lists.
- Validate imported XML before making any Library changes.

### Textuary JSON

- Provide an equivalent lossless backup and restore format.
- Keep the XML and JSON data models semantically aligned and versioned.
- Use JSON as a convenient programmatic format without making it a requirement for exchange.

### Markdown

- Export a human-readable Library or individual reading list.
- Include article titles, original links, metadata, tags, list membership and notes.
- Define a stable Textuary Markdown structure so Textuary-generated files can be imported reliably.
- Treat arbitrary Markdown conservatively rather than guessing at unsupported structures.

### OPML

- Export portable link-oriented reading lists using the established XML-based OPML format.
- Preserve list hierarchy, original links and tags where interoperable.
- Treat OPML imports as link-first entries unless a Textuary snapshot is also present in a full archive.

## Import behaviour

- Show a preview before committing an import: new articles, duplicates, lists, tags and notes.
- Detect duplicates using a normalised original URL and stable Textuary identifiers.
- Offer safe merge choices rather than silently overwriting existing notes or organisation.
- Import into a temporary in-memory model, validate it, then perform one atomic Library update.
- Sanitize all imported article HTML again, regardless of its declared source.
- Enforce file-size, article-count and snapshot-size limits with clear error messages.
- Keep a recoverable pre-import backup until the import succeeds.

Full Textuary XML and JSON archives can restore offline snapshots. Markdown and ordinary OPML files may contain only links; these entries become full offline articles after the user opens and saves them through Textuary.

## Library interface

- Add a sidebar or equivalent navigation for All articles, Unread, In progress, Finished, reading lists and tags.
- Add New list, Import and Export controls to the Library header.
- Add list, tag and note controls to article cards without crowding the reading toolbar.
- Allow search across article metadata, tags and notes.
- Display a discreet note indicator on articles that have personal notes.
- Keep all controls keyboard-accessible and usable in Chrome, macOS Safari and iPad-sized layouts.

## Data-model direction

- Introduce a versioned Library schema migration from the current version 1 structure.
- Store lists as independent records with stable IDs and ordering metadata.
- Store list membership by ID so renaming a list does not rewrite every article.
- Store tags as normalised values with display labels.
- Store article notes as Markdown plus timestamps.
- Preserve unknown compatible fields during import where practical to support future schema evolution.

## Delivery sequence

1. Specify the shared data model, XML vocabulary, XSD and versioning rules.
2. Implement and test the version 1 to version 2 Library migration.
3. Add reading lists, tags and their filtering interface.
4. Add article-level Markdown notes and expanded search.
5. Implement Textuary XML and JSON backup/restore.
6. Implement Markdown and OPML reading-list exchange.
7. Add duplicate previews, merge handling, rollback and hostile-input tests.
8. Complete Chrome, Safari, Windows and iPad-sized validation, then update privacy and store documentation.

## Release boundaries

Textuary 2.9 will not include:

- cloud synchronisation or user accounts
- collaborative lists or shared editing
- remote note processing
- passage-level highlights or annotations
- automatic fetching of every imported link
- unbounded image or video storage

Those boundaries keep the release private, understandable and compatible with Textuary's current permission model.


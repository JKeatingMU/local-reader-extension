# Textuary TikTok video

This production creates a 20.4-second, 1080 × 1920 vertical video advertising Textuary with genuine extension screenshots and a wholly synthetic source article.

## Creative structure

1. Busy article and opening hook
2. One-click transformation into Textuary
3. Calm reading view
4. Read-aloud controls
5. Private local Library
6. Chrome Web Store end card

The narration is generated locally with the installed **Serena (Premium)** Apple voice. Each sentence is rendered separately with controlled pauses for natural cadence. Captions carry the main message when the video is viewed without sound. No publisher branding, third-party article text, analytics claim, gating claim or advertising-removal claim appears in the creative.

## Build

From the repository root:

```sh
npm run marketing:tiktok
```

Outputs are written to `dist/marketing/textuary-tiktok/`:

- `textuary-tiktok-v1.mp4`
- `textuary-tiktok-cover.png`
- `textuary-tiktok-contact-sheet.png`
- `voiceover.aiff`

Suggested post copy is in [`POST_COPY.md`](POST_COPY.md).

# Textuary Support

## Before reporting a problem

1. Confirm that the page is an ordinary `http` or `https` article.
2. Wait for the article to finish loading, then activate Textuary again.
3. Confirm that Textuary has permission to access the current website.
4. In Chrome, reload the extension from `chrome://extensions` after installing an updated unpacked version.
5. Remember that a reader can process only content delivered to the browser.

## Natural voice troubleshooting

- Natural (Kokoro) speech currently requires a WebGPU-capable Chrome browser and graphics adapter. Safari uses System speech because the current ONNX WebGPU runtime can hang in WebKit.
- The first activation downloads and caches approximately 330 MB of model data. Check the internet connection and allow time for the progress message to complete.
- The first passage is slower than later passages. Performance varies by GPU; Textuary prepares one passage ahead to reduce pauses.
- If Natural speech fails, switch **Speech** to **System**. Article reading and system read-aloud do not depend on the Kokoro model.

## Report an issue

Use the [GitHub issue tracker](https://github.com/JKeatingMU/local-reader-extension/issues) and include:

- Textuary version
- browser and browser version
- operating system
- public article URL, if it is safe to share
- what you expected and what happened
- a screenshot, if useful and free of private information

Do not post account details, private article text, authentication information or other sensitive data.

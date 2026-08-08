# Install and test Textuary in Safari

Textuary 2.8 includes a containing Apple application and Safari Web Extension for macOS, iPhone and iPad. This packaged version can use installed Apple Enhanced and Premium voices through the on-device `AVSpeechSynthesizer` API. The older temporary-extension method still works for article-reader testing, but it cannot use this native voice bridge.

## macOS: packaged extension with Premium voices

1. Download an Apple Premium or Enhanced voice in **System Settings > Accessibility > Read & Speak**. Open the system voice chooser, choose **Manage Voices…** if shown, and download a voice labelled **Enhanced** or **Premium**. Selena Premium is one tested example; the available names vary by language and macOS version.
2. Open `safari/Textuary/Textuary.xcodeproj` in Xcode.
3. Select the **Textuary (macOS)** scheme and **My Mac**, then click **Run**.
4. In the Textuary application, click **Quit and Open Safari Settings…**, or open **Safari > Settings > Extensions** yourself.
5. Enable **Textuary** and approve website access when Safari asks.
6. If the temporary development version is also listed, disable it so there is only one active Textuary extension.
7. Open an ordinary article and click the Textuary toolbar button.
8. In the reader, open **Voice**, choose **Premium (Apple)** under **Speech engine**, then select the installed voice and speed.

If a newly downloaded voice is missing, close the current Textuary reading view and activate the extension again. Safari discovers installed native voices when the new reader opens.

The Premium voice menu deliberately shows only Apple's Enhanced and Premium voices. Choose **System** if you want the broader voice list exposed through browser speech synthesis.

## iPhone and iPad development test

1. Install an Enhanced or Premium voice under **Settings > Accessibility > Spoken Content > Voices**.
2. Open the Xcode project and select the **Textuary (iOS)** scheme.
3. Choose a connected iPhone or iPad and click **Run**. Xcode may first require the matching iOS platform component under **Xcode > Settings > Components**.
4. On the device, enable Textuary under **Settings > Apps > Safari > Extensions** and grant website access.
5. Open an article in Safari, activate Textuary, and choose **Premium (Apple)** in its reading view.

The iOS extension source compiles, but a physical iPad/iPhone runtime test remains required before distribution.

## Temporary Safari extension

For a quick reader-only test on macOS, Safari 26 can still load the repository folder temporarily:

1. Open **Safari > Settings > Advanced** and enable **Show features for web developers**.
2. Open the newly available **Developer** settings tab. This is separate from Safari's **Develop** menu.
3. Click **Add Temporary Extension** and select the repository folder containing `manifest.json`.
4. Enable Textuary under **Safari > Settings > Extensions** and approve website access.

Temporary extensions are removed after 24 hours or when Safari quits. Because this path does not load the containing application, use **System** speech with the temporary version. Use the Xcode-packaged extension for **Premium (Apple)** voices.

## Why Safari does not use Kokoro

Chrome's optional Natural mode uses Kokoro locally with WebGPU. Safari testing exposed an upstream ONNX/WebKit hang and, in one experiment, a WebKit content-process crash. Textuary therefore uses Apple's own on-device premium voices in Safari. This avoids the model download, works with voices the user has explicitly installed, and retains the same Textuary play, pause, resume, stop, speed and passage-highlighting controls.

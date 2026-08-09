import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.argv[2] || 9333);
const fixtureUrl = process.argv[3];
const fixtureName = process.argv[4] || "article";
const sourceRoot = process.argv[5] || ".";
const requestedScreenshotPath = process.argv[6];
const viewportWidth = Number(process.argv[7] || 1440);
const viewportHeight = Number(process.argv[8] || 900);
const screenshotTheme = process.argv[9] || "light";
const screenshotState = process.argv[10] || "reader";
const speechPlatform = process.argv[11] || "chrome";
if (!fixtureUrl) {
  throw new Error("Usage: node tests/chrome-smoke-test.mjs <debug-port> <fixture-url> [fixture-name] [source-root] [screenshot-path] [width] [height] [light|dark] [reader|settings|voice|voice-natural] [chrome|safari]");
}

const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No Chrome page target found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolveSocket, rejectSocket) => {
  socket.addEventListener("open", resolveSocket, { once: true });
  socket.addEventListener("error", rejectSocket, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve: resolveCall, reject: rejectCall } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) rejectCall(new Error(message.error.message));
  else resolveCall(message.result);
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCall, rejectCall) => {
    pending.set(id, { resolve: resolveCall, reject: rejectCall });
  });
}

await call("Page.enable");
await call("Runtime.enable");
await call("Emulation.setDeviceMetricsOverride", {
  width: viewportWidth,
  height: viewportHeight,
  deviceScaleFactor: 1,
  mobile: false
});
await call("Page.navigate", { url: fixtureUrl });
await new Promise((resolveWait) => setTimeout(resolveWait, fixtureName.endsWith("live") ? 7000 : 1200));

const speechMock = await call("Runtime.evaluate", {
  expression: `(() => {
    const calls = [];
    const naturalCalls = [];
    const availableVoices = [
      { name: 'Test Default', lang: 'en-IE', voiceURI: 'test-default', default: true, localService: true },
      { name: 'Test Alternate', lang: 'en-GB', voiceURI: 'test-alternate', default: false, localService: true }
    ];
    const listeners = {};
    const synth = {
      paused: false,
      current: null,
      voices: [],
      speak(utterance) { this.current = utterance; calls.push({ type: 'speak', text: utterance.text, lang: utterance.lang, rate: utterance.rate, voice: utterance.voice?.voiceURI }); },
      pause() { this.paused = true; calls.push({ type: 'pause' }); },
      resume() { this.paused = false; calls.push({ type: 'resume' }); },
      cancel() { calls.push({ type: 'cancel' }); },
      getVoices() { return this.voices; },
      addEventListener(type, listener) { listeners[type] = listener; },
      loadTestVoices() { this.voices = availableVoices; listeners.voiceschanged?.(); }
    };
    class MockUtterance {
      constructor(text) { this.text = text; }
    }
    class MockAudioContext {
      constructor() { this.state = 'running'; this.destination = {}; }
      async resume() { this.state = 'running'; naturalCalls.push({ type: 'context-resume' }); }
      async suspend() { this.state = 'suspended'; naturalCalls.push({ type: 'context-suspend' }); }
      async close() { this.state = 'closed'; }
      createBuffer(channels, length, sampleRate) {
        return { channels, length, sampleRate, copyToChannel(data) { this.dataLength = data.length; } };
      }
      createBufferSource() {
        const listeners = {};
        const source = {
          connect() {}, disconnect() {},
          addEventListener(type, listener) { listeners[type] = listener; },
          start() { naturalCalls.push({ type: 'natural-play', length: this.buffer?.length }); },
          stop() { naturalCalls.push({ type: 'natural-stop' }); },
          finish() { listeners.ended?.(); }
        };
        globalThis.__textuaryNaturalSource = source;
        return source;
      }
    }
    const kokoroModule = 'data:text/javascript,' + encodeURIComponent(\`
      export const env = {
        set wasmPaths(value) {
          globalThis.__localReaderNaturalTest.push({ type: 'wasm-path', value });
        },
        set logLevel(value) {
          globalThis.__localReaderNaturalTest.push({ type: 'log-level', value });
        }
      };
      export const KokoroTTS = {
        async from_pretrained(model, options) {
          globalThis.__localReaderNaturalTest.push({ type: 'model', model, dtype: options.dtype, device: options.device });
          options.progress_callback?.({ status: 'progress', file: 'model.onnx', progress: 50 });
          return {
            async generate(text, options) {
              globalThis.__localReaderNaturalTest.push({ type: 'generate', text, voice: options.voice, speed: options.speed });
              return { audio: new Float32Array([0, 0.1, -0.1, 0]), sampling_rate: 24000 };
            }
          };
        }
      };
    \`);
    Object.defineProperty(globalThis, 'speechSynthesis', { configurable: true, value: synth });
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: MockUtterance });
    Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: MockAudioContext });
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: { async requestAdapter() { return {}; } } });
    if (${JSON.stringify(speechPlatform)} === 'safari') {
      Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15' });
    }
    const storedPreferences = {};
    const storage = { local: {
        async get(key) { return { [key]: storedPreferences[key] }; },
        async set(values) { Object.assign(storedPreferences, values); }
      } };
    let nativeState = 'idle';
    let nativeRequestId = '';
    const runtime = {
      getURL(path) {
        if (path === 'print.css') return ${JSON.stringify(`${new URL(fixtureUrl).origin}/print.css`)};
        return path === 'vendor/kokoro.web.js' ? kokoroModule : 'chrome-extension://textuary-test/' + path;
      },
      async sendMessage(message) {
        const payload = message?.payload || {};
        naturalCalls.push({ type: 'native-command', command: payload.command, ...payload });
        if (payload.command === 'voices') return { ok: true, voices: [
          { identifier: 'com.apple.voice.premium.selena', name: 'Selena', language: 'en-GB', quality: 'Premium' },
          { identifier: 'com.apple.voice.enhanced.ava', name: 'Ava', language: 'en-US', quality: 'Enhanced' }
        ] };
        if (payload.command === 'speak') {
          nativeState = 'speaking';
          nativeRequestId = payload.requestId;
        } else if (payload.command === 'pause') nativeState = 'paused';
        else if (payload.command === 'resume') nativeState = 'speaking';
        else if (payload.command === 'stop') {
          nativeState = 'idle';
          nativeRequestId = '';
        }
        return { ok: true, state: nativeState, requestId: nativeRequestId };
      }
    };
    if (globalThis.chrome) {
      Object.defineProperty(globalThis.chrome, 'storage', { configurable: true, value: storage });
      Object.defineProperty(globalThis.chrome, 'runtime', { configurable: true, value: runtime });
    } else Object.defineProperty(globalThis, 'chrome', { configurable: true, value: { storage, runtime } });
    globalThis.__localReaderSpeechTest = calls;
    globalThis.__localReaderNaturalTest = naturalCalls;
    globalThis.__textuaryStoredPreferences = storedPreferences;
    return true;
  })()`,
  returnByValue: true
});
if (speechMock.exceptionDetails) throw new Error("Speech synthesis mock could not be installed");

for (const file of ["vendor/Readability.js", "vendor/purify.min.js", "reader.js"]) {
  const source = await readFile(resolve(sourceRoot, file), "utf8");
  const injection = await call("Runtime.evaluate", {
    expression: source,
    awaitPromise: true,
    returnByValue: true
  });
  if (injection.exceptionDetails) {
    throw new Error(injection.exceptionDetails.exception?.description || `${file} injection failed`);
  }
}

await new Promise((resolveWait) => setTimeout(resolveWait, 1600));
await call("Runtime.evaluate", {
  expression: "speechSynthesis.loadTestVoices()",
  returnByValue: true
});
await new Promise((resolveWait) => setTimeout(resolveWait, 50));
const inspection = await call("Runtime.evaluate", {
  expression: `(() => {
    const paragraphs = [...document.querySelectorAll('#lr-content p')];
    return JSON.stringify({
      reader: Boolean(document.querySelector('#local-reader-view')),
      title: document.querySelector('h1')?.textContent?.trim(),
      site: document.querySelector('.lr-kicker')?.textContent?.trim(),
      paragraphs: paragraphs.length,
      figures: document.querySelectorAll('#lr-content figure').length,
      images: document.querySelectorAll('#lr-content img').length,
      imageSources: [...document.querySelectorAll('#lr-content img')].map((image) => ({ src: image.src, srcset: image.srcset, loading: image.loading })),
      videos: document.querySelectorAll('#lr-content video').length,
      videoSources: [...document.querySelectorAll('#lr-content video')].map((video) => ({ src: video.src, poster: video.poster, controls: video.controls, autoplay: video.autoplay })),
      sourceSources: [...document.querySelectorAll('#lr-content video source')].map((source) => source.src),
      controls: document.querySelectorAll('.lr-toolbar button').length,
      primaryActionButtons: document.querySelectorAll('.lr-tools > button').length,
      moreMenu: Boolean(document.querySelector('.lr-actions')),
      actionsLabel: document.querySelector('.lr-actions > summary')?.textContent?.trim(),
      saveLabel: document.querySelector('#lr-save')?.textContent,
      libraryButton: Boolean(document.querySelector('#lr-library')),
      libraryInNavigation: Boolean(document.querySelector('.lr-nav > #lr-library')),
      voiceSettings: Boolean(document.querySelector('.lr-voice-settings')),
      voiceSummary: document.querySelector('#lr-voice-summary')?.textContent?.trim(),
      progressLabelPosition: getComputedStyle(document.querySelector('#lr-progress-label')).position,
      settingsSelects: document.querySelectorAll('.lr-settings-panel select').length,
      settingsRanges: document.querySelectorAll('.lr-settings-panel input[type="range"]').length,
      progressBars: document.querySelectorAll('[role="progressbar"]').length,
      readingMeta: document.querySelector('.lr-reading-meta')?.textContent?.trim(),
      speechSelects: document.querySelectorAll('.lr-speech-setting select').length,
      speechEngineOptions: document.querySelector('#lr-speech-engine')?.options.length,
      naturalEngineDisabled: document.querySelector('#lr-speech-engine option[value="${speechPlatform === "safari" ? "apple" : "kokoro"}"]')?.disabled,
      voiceOptions: document.querySelector('#lr-speech-voice')?.options.length,
      voiceSelectDisabled: document.querySelector('#lr-speech-voice')?.disabled,
      rateOptions: document.querySelector('#lr-speech-rate')?.options.length,
      toolbarHeight: Math.round(document.querySelector('.lr-toolbar')?.getBoundingClientRect().height || 0),
      toolbarButtonFontSizes: [...document.querySelectorAll('.lr-toolbar button')].map((control) => getComputedStyle(control).fontSize),
      toolbarSummaryFontSizes: [...document.querySelectorAll('.lr-toolbar summary')].map((control) => getComputedStyle(control).fontSize),
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      readerWidth: Math.round(document.querySelector('.lr-page')?.getBoundingClientRect().width || 0),
      extractionSummary: document.querySelector('footer span')?.textContent?.trim(),
      textLength: document.querySelector('#lr-content')?.textContent?.replace(/\\s+/g, ' ').trim().length,
      firstParagraph: paragraphs.at(0)?.textContent?.replace(/\\s+/g, ' ').trim(),
      lastParagraph: paragraphs.at(-1)?.textContent?.replace(/\\s+/g, ' ').trim(),
      shortParagraphs: paragraphs.map((paragraph) => paragraph.textContent.replace(/\\s+/g, ' ').trim()).filter((text) => text.length < 80),
      containsProductCta: document.querySelector('#lr-content')?.textContent?.includes('Shop'),
      containsPlayerControls: /Loaded:\s*0%|Progress:\s*0%|Current Time|Duration Time|Full Size/.test(document.querySelector('#lr-content')?.textContent || '')
    });
  })()`,
  returnByValue: true
});
const result = JSON.parse(inspection.result.value);

const printInspection = await call("Runtime.evaluate", {
  expression: `(() => {
    let called = false;
    window.print = () => { called = true; };
    const menu = document.querySelector('.lr-actions');
    menu.open = true;
    document.querySelector('#lr-print')?.click();
    return JSON.stringify({ called, menuOpen: menu.open });
  })()`,
  returnByValue: true
});
const printControl = JSON.parse(printInspection.result.value);

const libraryInspection = await call("Runtime.evaluate", {
  expression: `(async () => {
    document.querySelector('#lr-save')?.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 40));
    const library = globalThis.__textuaryStoredPreferences.textuarySavedArticles;
    const article = library?.articles?.[0];
    return JSON.stringify({
      label: document.querySelector('#lr-save')?.textContent,
      count: library?.articles?.length || 0,
      title: article?.title,
      sourceUrl: article?.sourceUrl,
      contentLength: article?.content?.length || 0,
      progress: article?.progress,
      read: article?.read
    });
  })()`,
  awaitPromise: true,
  returnByValue: true
});
const library = JSON.parse(libraryInspection.result.value);

const speechInspection = await call("Runtime.evaluate", {
  expression: `(async () => {
    const toggle = document.querySelector('#lr-speech-toggle');
    const stop = document.querySelector('#lr-speech-stop');
    const voice = document.querySelector('#lr-speech-voice');
    const rate = document.querySelector('#lr-speech-rate');
    voice.value = 'test-alternate';
    voice.dispatchEvent(new Event('change'));
    rate.value = '1.5';
    rate.dispatchEvent(new Event('change'));
    toggle?.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
    const afterPlay = { label: toggle?.textContent, stopDisabled: stop?.disabled, stopHidden: stop?.hidden, highlighted: document.querySelectorAll('.lr-speaking').length };
    speechSynthesis.current?.onend?.();
    const advancedToNextChunk = globalThis.__localReaderSpeechTest.filter(({ type }) => type === 'speak').length >= 2;
    toggle?.click();
    const afterPause = { label: toggle?.textContent, paused: speechSynthesis.paused };
    await new Promise((resolveWait) => setTimeout(resolveWait, 60));
    const pausePosition = globalThis.__textuaryStoredPreferences.textuarySavedArticles?.articles?.[0]?.speechIndex;
    toggle?.click();
    const afterResume = { label: toggle?.textContent, paused: speechSynthesis.paused };
    stop?.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 60));
    return JSON.stringify({
      afterPlay,
      advancedToNextChunk,
      afterPause,
      afterResume,
      afterStop: { label: toggle?.textContent, stopDisabled: stop?.disabled, stopHidden: stop?.hidden, highlighted: document.querySelectorAll('.lr-speaking').length },
      voiceSummary: document.querySelector('#lr-voice-summary')?.textContent?.trim(),
      pausePosition,
      stopPosition: globalThis.__textuaryStoredPreferences.textuarySavedArticles?.articles?.[0]?.speechIndex,
      calls: globalThis.__localReaderSpeechTest,
      firstSpokenText: globalThis.__localReaderSpeechTest.find(({ type }) => type === 'speak')?.text,
      secondSpokenText: globalThis.__localReaderSpeechTest.filter(({ type }) => type === 'speak')[1]?.text,
      firstSpokenRate: globalThis.__localReaderSpeechTest.find(({ type }) => type === 'speak')?.rate,
      firstSpokenVoice: globalThis.__localReaderSpeechTest.find(({ type }) => type === 'speak')?.voice
    });
  })()`,
  awaitPromise: true,
  returnByValue: true
});
if (speechInspection.exceptionDetails) {
  throw new Error(speechInspection.exceptionDetails.exception?.description || "System speech inspection failed");
}
const speech = JSON.parse(speechInspection.result.value);

const naturalSpeechInspection = await call("Runtime.evaluate", {
  expression: `(async () => {
    const safari = ${JSON.stringify(speechPlatform)} === 'safari';
    const engine = document.querySelector('#lr-speech-engine');
    const voice = document.querySelector('#lr-speech-voice');
    const toggle = document.querySelector('#lr-speech-toggle');
    const stop = document.querySelector('#lr-speech-stop');
    engine.value = safari ? 'apple' : 'kokoro';
    engine.dispatchEvent(new Event('change'));
    await new Promise((resolveWait) => setTimeout(resolveWait, 30));
    voice.value = safari ? 'com.apple.voice.premium.selena' : 'bf_emma';
    voice.dispatchEvent(new Event('change'));
    toggle.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
    const consentOpen = document.querySelector('#lr-kokoro-consent')?.open;
    if (!safari) document.querySelector('#lr-kokoro-consent button[value="enable"]')?.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 120));
    const afterPlay = { label: toggle.textContent, highlighted: document.querySelectorAll('.lr-speaking').length };
    toggle.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
    const afterPause = { label: toggle.textContent };
    toggle.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
    const afterResume = { label: toggle.textContent };
    stop.click();
    return JSON.stringify({
      consentOpen,
      voiceOptions: voice.options.length,
      afterPlay,
      afterPause,
      afterResume,
      afterStop: { label: toggle.textContent, highlighted: document.querySelectorAll('.lr-speaking').length },
      calls: globalThis.__localReaderNaturalTest,
      saved: globalThis.__textuaryStoredPreferences.textuaryReadingPreferences
    });
  })()`,
  awaitPromise: true,
  returnByValue: true
});
const naturalSpeech = JSON.parse(naturalSpeechInspection.result.value);

const styleInspection = await call("Runtime.evaluate", {
  expression: `(async () => {
    const change = (selector, value, eventType = 'change') => {
      const control = document.querySelector(selector);
      control.value = value;
      control.dispatchEvent(new Event(eventType));
    };
    change('#lr-theme', 'ambient');
    change('#lr-font-family', 'modern');
    change('#lr-font-size', '23', 'input');
    change('#lr-line-height', '1.9');
    change('#lr-column-width', '900');
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
    return JSON.stringify({
      theme: document.body.dataset.lrTheme,
      fontSize: document.documentElement.style.getPropertyValue('--lr-font-size'),
      lineHeight: document.documentElement.style.getPropertyValue('--lr-line-height'),
      columnWidth: document.documentElement.style.getPropertyValue('--lr-page-width'),
      fontFamily: document.documentElement.style.getPropertyValue('--lr-reading-font'),
      saved: globalThis.__textuaryStoredPreferences.textuaryReadingPreferences
    });
  })()`,
  awaitPromise: true,
  returnByValue: true
});
const style = JSON.parse(styleInspection.result.value);

const progressInspection = await call("Runtime.evaluate", {
  expression: `(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolveWait) => setTimeout(resolveWait, 180));
    const result = {
      value: Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')),
      label: document.querySelector('#lr-progress-label')?.textContent
    };
    scrollTo(0, 0);
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    return JSON.stringify(result);
  })()`,
  awaitPromise: true,
  returnByValue: true
});
const progress = JSON.parse(progressInspection.result.value);

await call("Runtime.evaluate", {
  expression: `(() => {
    const engine = document.querySelector('#lr-speech-engine');
    if (engine) {
      engine.value = 'system';
      engine.dispatchEvent(new Event('change'));
    }
    const voice = document.querySelector('#lr-speech-voice');
    const rate = document.querySelector('#lr-speech-rate');
    if (voice) {
      voice.value = '';
      voice.dispatchEvent(new Event('change'));
    }
    if (rate) {
      rate.value = '1';
      rate.dispatchEvent(new Event('change'));
    }
    if (${JSON.stringify(screenshotState)} === 'voice-natural' && engine) {
      engine.value = 'kokoro';
      engine.dispatchEvent(new Event('change'));
      if (voice) {
        voice.value = 'bf_emma';
        voice.dispatchEvent(new Event('change'));
      }
    }
    const theme = document.querySelector('#lr-theme');
    if (theme) {
      theme.value = ${JSON.stringify(screenshotTheme)} === 'dark' ? 'evening' : 'paper';
      theme.dispatchEvent(new Event('change'));
    }
    const settings = document.querySelector('.lr-settings');
    if (settings) settings.open = ${JSON.stringify(screenshotState)} === 'settings';
    const voiceSettings = document.querySelector('.lr-voice-settings');
    if (voiceSettings) voiceSettings.open = ${JSON.stringify(screenshotState)}.startsWith('voice');
    for (const notice of document.querySelectorAll('.lr-speech-status')) notice.hidden = true;
  })()`,
  returnByValue: true
});
await new Promise((resolveWait) => setTimeout(resolveWait, 250));
const themeInspection = await call("Runtime.evaluate", {
  expression: `JSON.stringify({
    theme: document.body.dataset.lrTheme,
    scrollY,
    body: getComputedStyle(document.body).color,
    kicker: getComputedStyle(document.querySelector('.lr-kicker')).color,
    standfirst: getComputedStyle(document.querySelector('.lr-standfirst')).color,
    rule: getComputedStyle(document.querySelector('.lr-rule')).backgroundColor
  })`,
  returnByValue: true
});
const themeState = JSON.parse(themeInspection.result.value);

const screenshot = await call("Page.captureScreenshot", { format: "png" });
const screenshotPath = requestedScreenshotPath || `/private/tmp/local-reader-${fixtureName}.png`;
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

const printPdf = await call("Page.printToPDF", {
  printBackground: true,
  preferCSSPageSize: true
});
const printPdfPath = `/private/tmp/textuary-print-${fixtureName}.pdf`;
const printPdfBuffer = Buffer.from(printPdf.data, "base64");
await writeFile(printPdfPath, printPdfBuffer);

console.log(JSON.stringify({
  fixtureName,
  ...result,
  library,
  speech,
  naturalSpeech,
  style,
  progress,
  themeState,
  printPdfBytes: printPdfBuffer.length,
  screenshotPath,
  printPdfPath
}, null, 2));

const expectations = {
  dailymail: {
    minParagraphs: 30,
    minTextLength: 7000,
    firstPrefix: "They’re everywhere.",
    lastSuffix: "rolled-up newspaper.",
    site: "Mail Online",
    method: "Rendered page"
  },
  irishtimes: {
    minParagraphs: 65,
    minTextLength: 13000,
    firstPrefix: "Is the State pension your fallback plan",
    lastSuffix: "financial wellbeing in retirement.",
    site: "The Irish Times",
    method: "Rendered page"
  },
  irishtimeslive: {
    minParagraphs: 65,
    minTextLength: 13000,
    firstPrefix: "Is the State pension your fallback plan",
    lastSuffix: "financial wellbeing in retirement.",
    site: "The Irish Times",
    method: "Original page HTML"
  },
  clientpaywall: {
    minParagraphs: 12,
    minTextLength: 2400,
    firstPrefix: "The first paragraph remains visible",
    lastSuffix: "clean reader view.",
    site: "Example Gazette",
    method: "Original page HTML"
  },
  media: {
    minParagraphs: 6,
    minTextLength: 1700,
    firstPrefix: "The opening paragraph establishes",
    lastSuffix: "playback-status debris.",
    site: "Example Gazette",
    method: "Rendered page",
    title: "A complete investigation with photographs and video evidence",
    minVideos: 1,
    videoSourceSuffix: "/sample-video.mp4",
    requiresCleanPlayer: true,
    imageSuffix: "/store-reading.svg"
  },
  article: {
    minParagraphs: 2,
    minTextLength: 400,
    firstPrefix: "",
    lastSuffix: "",
    site: "",
    method: ""
  }
};
const expected = expectations[fixtureName] || expectations.article;
const safariNativeSpeechOkay = speechPlatform !== "safari" || (
  !naturalSpeech.consentOpen &&
  naturalSpeech.voiceOptions === 2 &&
  naturalSpeech.calls.some(({ type, command }) => type === "native-command" && command === "voices") &&
  naturalSpeech.calls.some(({ type, command, voiceIdentifier, rate, text }) =>
    type === "native-command" &&
    command === "speak" &&
    voiceIdentifier === "com.apple.voice.premium.selena" &&
    rate === 1.5 &&
    text?.startsWith(result.title)
  ) &&
  naturalSpeech.calls.some(({ type, command }) => type === "native-command" && command === "pause") &&
  naturalSpeech.calls.some(({ type, command }) => type === "native-command" && command === "resume") &&
  naturalSpeech.calls.some(({ type, command }) => type === "native-command" && command === "stop") &&
  naturalSpeech.saved?.speechEngine === "apple" &&
  naturalSpeech.saved?.appleVoice === "com.apple.voice.premium.selena"
);
const chromeNaturalSpeechOkay = speechPlatform === "safari" || (
  naturalSpeech.consentOpen &&
  naturalSpeech.voiceOptions === 28 &&
  naturalSpeech.calls.some(({ type, dtype, device }) => type === "model" && dtype === "fp32" && device === "webgpu") &&
  naturalSpeech.calls.some(({ type, value }) => type === "wasm-path" && value === "chrome-extension://textuary-test/vendor/") &&
  naturalSpeech.calls.some(({ type, value }) => type === "log-level" && value === "error") &&
  naturalSpeech.calls.some(({ type, voice, speed }) => type === "generate" && voice === "bf_emma" && speed === 1.5) &&
  naturalSpeech.saved?.speechEngine === "kokoro" &&
  naturalSpeech.saved?.kokoroConsent === true
);

if (
  !result.reader ||
  (expected.title && result.title !== expected.title) ||
  result.paragraphs < expected.minParagraphs ||
  result.controls !== 7 ||
  result.primaryActionButtons !== 2 ||
  !result.moreMenu ||
  result.actionsLabel !== "Actions" ||
  !printControl.called ||
  printControl.menuOpen ||
  printPdfBuffer.length < 10_000 ||
  result.saveLabel !== "Save article" ||
  !result.libraryButton ||
  !result.libraryInNavigation ||
  !result.voiceSettings ||
  !result.voiceSummary?.includes("1×") ||
  result.progressLabelPosition !== "fixed" ||
  result.settingsSelects !== 4 ||
  result.settingsRanges !== 1 ||
  result.progressBars !== 1 ||
  !result.readingMeta?.includes("min read") ||
  result.speechSelects !== 3 ||
  result.speechEngineOptions !== 2 ||
  result.naturalEngineDisabled ||
  result.voiceOptions !== 3 ||
  result.voiceSelectDisabled ||
  result.rateOptions !== 5 ||
  new Set([...result.toolbarButtonFontSizes, ...result.toolbarSummaryFontSizes]).size !== 1 ||
  result.toolbarButtonFontSizes[0] !== "14px" ||
  result.toolbarHeight > 60 ||
  result.documentWidth > result.viewportWidth ||
  result.readerWidth < 1000 ||
  result.images < 1 ||
  (expected.minVideos && result.videos < expected.minVideos) ||
  (expected.requiresCleanPlayer && result.containsPlayerControls) ||
  (expected.imageSuffix && !result.imageSources.some(({ src, srcset, loading }) =>
    (src.endsWith(expected.imageSuffix) || srcset.includes(expected.imageSuffix)) && loading === "eager"
  )) ||
  (expected.minVideos && !result.videoSources.some(({ poster, controls, autoplay }) =>
    poster.endsWith("/store-reading.svg") && controls && !autoplay
  )) ||
  (expected.videoSourceSuffix && !result.sourceSources.some((src) => src.endsWith(expected.videoSourceSuffix))) ||
  result.textLength < expected.minTextLength ||
  result.containsProductCta ||
  !result.firstParagraph?.startsWith(expected.firstPrefix) ||
  !result.lastParagraph?.endsWith(expected.lastSuffix) ||
  !result.site?.startsWith(expected.site) ||
  !result.extractionSummary?.includes(expected.method) ||
  speech.afterPlay.label !== "Pause" ||
  speech.afterPlay.stopDisabled ||
  speech.afterPlay.stopHidden ||
  speech.afterPlay.highlighted !== 1 ||
  !speech.advancedToNextChunk ||
  speech.afterPause.label !== "Resume" ||
  !speech.afterPause.paused ||
  speech.afterResume.label !== "Pause" ||
  speech.afterResume.paused ||
  speech.pausePosition < 1 ||
  speech.stopPosition !== 0 ||
  speech.afterStop.label !== "Read aloud" ||
  !speech.afterStop.stopDisabled ||
  !speech.afterStop.stopHidden ||
  speech.afterStop.highlighted !== 0 ||
  !speech.voiceSummary?.includes("Test Alternate · 1.5×") ||
  !speech.calls.some(({ type }) => type === "speak") ||
  !speech.firstSpokenText?.startsWith(result.title) ||
  !speech.secondSpokenText?.startsWith("By ") ||
  speech.firstSpokenRate !== 1.5 ||
  speech.firstSpokenVoice !== "test-alternate" ||
  !safariNativeSpeechOkay ||
  !chromeNaturalSpeechOkay ||
  naturalSpeech.afterPlay.label !== "Pause" ||
  naturalSpeech.afterPlay.highlighted !== 1 ||
  naturalSpeech.afterPause.label !== "Resume" ||
  naturalSpeech.afterResume.label !== "Pause" ||
  naturalSpeech.afterStop.label !== "Read aloud" ||
  naturalSpeech.afterStop.highlighted !== 0 ||
  style.theme !== "ambient" ||
  style.fontSize !== "23px" ||
  style.lineHeight !== "1.9" ||
  style.columnWidth !== "900px" ||
  !style.fontFamily.includes("ui-sans-serif") ||
  style.saved?.fontSize !== 23 ||
  style.saved?.speechRate !== "1.5" ||
  progress.value < 99 ||
  progress.label !== "Finished" ||
  library.label !== "Saved ✓" ||
  library.count !== 1 ||
  library.title !== result.title ||
  library.sourceUrl !== fixtureUrl ||
  library.contentLength < expected.minTextLength ||
  library.read !== false
) {
  process.exitCode = 1;
}

socket.close();

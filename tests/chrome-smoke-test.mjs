import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.argv[2] || 9333);
const fixtureUrl = process.argv[3];
const fixtureName = process.argv[4] || "article";
if (!fixtureUrl) {
  throw new Error("Usage: node tests/chrome-smoke-test.mjs <debug-port> <fixture-url> [fixture-name]");
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
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false
});
await call("Page.navigate", { url: fixtureUrl });
await new Promise((resolveWait) => setTimeout(resolveWait, fixtureName.endsWith("live") ? 7000 : 1200));

const speechMock = await call("Runtime.evaluate", {
  expression: `(() => {
    const calls = [];
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
    Object.defineProperty(globalThis, 'speechSynthesis', { configurable: true, value: synth });
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: MockUtterance });
    globalThis.__localReaderSpeechTest = calls;
    return true;
  })()`,
  returnByValue: true
});
if (speechMock.exceptionDetails) throw new Error("Speech synthesis mock could not be installed");

for (const file of ["vendor/Readability.js", "vendor/purify.min.js", "reader.js"]) {
  const source = await readFile(resolve(file), "utf8");
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
    const toolbarItems = [...document.querySelectorAll('.lr-toolbar > button, .lr-tools > button, .lr-tools > label')];
    return JSON.stringify({
      reader: Boolean(document.querySelector('#local-reader-view')),
      title: document.querySelector('h1')?.textContent?.trim(),
      site: document.querySelector('.lr-kicker')?.textContent?.trim(),
      paragraphs: paragraphs.length,
      figures: document.querySelectorAll('#lr-content figure').length,
      images: document.querySelectorAll('#lr-content img').length,
      controls: document.querySelectorAll('.lr-toolbar button').length,
      speechSelects: document.querySelectorAll('.lr-speech-setting select').length,
      voiceOptions: document.querySelector('#lr-speech-voice')?.options.length,
      voiceSelectDisabled: document.querySelector('#lr-speech-voice')?.disabled,
      rateOptions: document.querySelector('#lr-speech-rate')?.options.length,
      toolbarRows: new Set(toolbarItems.map((item) => Math.round(item.getBoundingClientRect().top))).size,
      readerWidth: Math.round(document.querySelector('.lr-page')?.getBoundingClientRect().width || 0),
      extractionSummary: document.querySelector('footer span')?.textContent?.trim(),
      textLength: document.querySelector('#lr-content')?.textContent?.replace(/\\s+/g, ' ').trim().length,
      firstParagraph: paragraphs.at(0)?.textContent?.replace(/\\s+/g, ' ').trim(),
      lastParagraph: paragraphs.at(-1)?.textContent?.replace(/\\s+/g, ' ').trim(),
      shortParagraphs: paragraphs.map((paragraph) => paragraph.textContent.replace(/\\s+/g, ' ').trim()).filter((text) => text.length < 80),
      containsProductCta: document.querySelector('#lr-content')?.textContent?.includes('Shop')
    });
  })()`,
  returnByValue: true
});
const result = JSON.parse(inspection.result.value);

const speechInspection = await call("Runtime.evaluate", {
  expression: `(async () => {
    const toggle = document.querySelector('#lr-speech-toggle');
    const stop = document.querySelector('#lr-speech-stop');
    const voice = document.querySelector('#lr-speech-voice');
    const rate = document.querySelector('#lr-speech-rate');
    voice.value = 'test-alternate';
    rate.value = '1.5';
    toggle?.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
    const afterPlay = { label: toggle?.textContent, stopDisabled: stop?.disabled };
    speechSynthesis.current?.onend?.();
    const advancedToNextChunk = globalThis.__localReaderSpeechTest.filter(({ type }) => type === 'speak').length >= 2;
    toggle?.click();
    const afterPause = { label: toggle?.textContent, paused: speechSynthesis.paused };
    toggle?.click();
    const afterResume = { label: toggle?.textContent, paused: speechSynthesis.paused };
    stop?.click();
    return JSON.stringify({
      afterPlay,
      advancedToNextChunk,
      afterPause,
      afterResume,
      afterStop: { label: toggle?.textContent, stopDisabled: stop?.disabled },
      calls: globalThis.__localReaderSpeechTest,
      firstSpokenText: globalThis.__localReaderSpeechTest.find(({ type }) => type === 'speak')?.text,
      firstSpokenRate: globalThis.__localReaderSpeechTest.find(({ type }) => type === 'speak')?.rate,
      firstSpokenVoice: globalThis.__localReaderSpeechTest.find(({ type }) => type === 'speak')?.voice
    });
  })()`,
  awaitPromise: true,
  returnByValue: true
});
const speech = JSON.parse(speechInspection.result.value);

const screenshot = await call("Page.captureScreenshot", { format: "png" });
const screenshotPath = `/private/tmp/local-reader-${fixtureName}.png`;
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

console.log(JSON.stringify({ fixtureName, ...result, speech, screenshotPath }, null, 2));

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

if (
  !result.reader ||
  result.paragraphs < expected.minParagraphs ||
  result.controls !== 7 ||
  result.speechSelects !== 2 ||
  result.voiceOptions !== 3 ||
  result.voiceSelectDisabled ||
  result.rateOptions !== 5 ||
  result.toolbarRows !== 1 ||
  result.readerWidth < 1000 ||
  result.images < 1 ||
  result.textLength < expected.minTextLength ||
  result.containsProductCta ||
  !result.firstParagraph?.startsWith(expected.firstPrefix) ||
  !result.lastParagraph?.endsWith(expected.lastSuffix) ||
  !result.site?.startsWith(expected.site) ||
  !result.extractionSummary?.includes(expected.method) ||
  speech.afterPlay.label !== "Pause" ||
  speech.afterPlay.stopDisabled ||
  !speech.advancedToNextChunk ||
  speech.afterPause.label !== "Resume" ||
  !speech.afterPause.paused ||
  speech.afterResume.label !== "Pause" ||
  speech.afterResume.paused ||
  speech.afterStop.label !== "Read aloud" ||
  !speech.afterStop.stopDisabled ||
  !speech.calls.some(({ type }) => type === "speak") ||
  !speech.firstSpokenText?.startsWith(result.title) ||
  speech.firstSpokenRate !== 1.5 ||
  speech.firstSpokenVoice !== "test-alternate"
) {
  process.exitCode = 1;
}

socket.close();

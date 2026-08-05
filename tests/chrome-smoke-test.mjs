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
await call("Page.navigate", { url: fixtureUrl });
await new Promise((resolveWait) => setTimeout(resolveWait, fixtureName.endsWith("live") ? 7000 : 1200));

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
      controls: document.querySelectorAll('.lr-toolbar button').length,
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

const screenshot = await call("Page.captureScreenshot", { format: "png" });
const screenshotPath = `/private/tmp/local-reader-${fixtureName}.png`;
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

console.log(JSON.stringify({ fixtureName, ...result, screenshotPath }, null, 2));

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
  result.controls !== 5 ||
  result.images < 1 ||
  result.textLength < expected.minTextLength ||
  result.containsProductCta ||
  !result.firstParagraph?.startsWith(expected.firstPrefix) ||
  !result.lastParagraph?.endsWith(expected.lastSuffix) ||
  !result.site?.startsWith(expected.site) ||
  !result.extractionSummary?.includes(expected.method)
) {
  process.exitCode = 1;
}

socket.close();

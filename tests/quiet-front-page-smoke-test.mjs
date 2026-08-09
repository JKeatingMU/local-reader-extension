import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.argv[2] || 9352);
const fixtureUrl = process.argv[3];
const screenshotPath = process.argv[4] || "/private/tmp/quiet-front-page-preview.png";
const mode = process.argv[5] || "fixture";
if (!fixtureUrl) {
  throw new Error("Usage: node tests/quiet-front-page-smoke-test.mjs <debug-port> <fixture-url> [screenshot-path]");
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
  return new Promise((resolveCall, rejectCall) => pending.set(id, { resolve: resolveCall, reject: rejectCall }));
}

await call("Page.enable");
await call("Runtime.enable");
await call("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false
});
await call("Page.navigate", { url: fixtureUrl });
await new Promise((resolveWait) => setTimeout(resolveWait, mode === "live" ? 5000 : 500));

const source = await readFile(resolve("prototypes/quiet-front-page/quiet.js"), "utf8");
const injection = await call("Runtime.evaluate", {
  expression: source,
  awaitPromise: true,
  returnByValue: true
});
if (injection.exceptionDetails) {
  throw new Error(injection.exceptionDetails.exception?.description || "Quiet Front Page injection failed");
}

await new Promise((resolveWait) => setTimeout(resolveWait, 400));
const inspectionResult = await call("Runtime.evaluate", {
  expression: `(() => {
    const root = document.querySelector('#textuary-quiet-front-page');
    const quiet = root?.shadowRoot;
    const shell = quiet?.querySelector('.qfp-shell');
    return JSON.stringify({
      root: Boolean(root && quiet),
      title: document.title,
      storyCount: Number(root?.dataset.storyCount),
      cards: quiet?.querySelectorAll('.qfp-story').length || 0,
      images: quiet?.querySelectorAll('.qfp-story img').length || 0,
      imageSources: [...(quiet?.querySelectorAll('.qfp-story img') || [])].map((image) => image.src),
      links: [...(quiet?.querySelectorAll('.qfp-story h2 a') || [])].map((link) => ({ text: link.textContent.trim(), href: link.href })),
      summaries: quiet?.querySelectorAll('.qfp-summary:not(.qfp-summary-muted)').length || 0,
      toolbarButtons: quiet?.querySelectorAll('.qfp-toolbar button').length || 0,
      pageWidth: shell?.scrollWidth || 0,
      viewportWidth: innerWidth
    });
  })()`,
  returnByValue: true
});
const inspection = JSON.parse(inspectionResult.result.value);

assert(inspection.root, "the quiet view was not rendered");
if (mode === "fixture") {
  assert(inspection.storyCount === 6, `expected 6 stories, found ${inspection.storyCount}`);
  assert(inspection.cards === 6, `expected 6 cards, found ${inspection.cards}`);
  assert(inspection.images === 5, `expected 5 story images, found ${inspection.images}`);
  assert(inspection.imageSources.some((url) => url.endsWith("/river.svg")), "lazy-loaded river image was not promoted");
  assert(!inspection.imageSources.some((url) => url.endsWith("/placeholder.svg")), "placeholder image survived extraction");
  assert(inspection.links.length === 6, "story links were not deduplicated");
  assert(inspection.links.every(({ href }) => new URL(href).hostname === "127.0.0.1"), "an external link survived extraction");
  assert(inspection.links[0].text.startsWith("A forgotten coastal path"), "editorial order was not preserved");
  assert(inspection.links.at(-1).text.startsWith("Citizen scientists"), "last story order changed");
  assert(inspection.summaries === 6, "story summaries were not retained");
} else {
  const sourceHost = new URL(fixtureUrl).hostname.replace(/^www\./, "");
  assert(inspection.storyCount >= 8, `expected at least 8 live stories, found ${inspection.storyCount}`);
  assert(inspection.cards === inspection.storyCount, "live story count and card count differ");
  assert(inspection.images >= 4, `expected at least 4 live story images, found ${inspection.images}`);
  assert(inspection.links.length === inspection.storyCount, "live story links were not deduplicated");
  assert(inspection.links.every(({ href }) => new URL(href).hostname.replace(/^www\./, "") === sourceHost), "a cross-publication link survived extraction");
}
assert(inspection.toolbarButtons === 3, "quiet-view controls are incomplete");
assert(inspection.pageWidth <= inspection.viewportWidth, "quiet view has horizontal overflow");

const screenshot = await call("Page.captureScreenshot", { format: "png" });
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

let controls = null;
if (mode === "fixture") {
  const controlRectsResult = await call("Runtime.evaluate", {
    expression: `JSON.stringify(['qfp-detail', 'qfp-density'].map((id) => {
      const rect = document.querySelector('#textuary-quiet-front-page').shadowRoot.getElementById(id).getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }))`,
    returnByValue: true
  });
  const controlRects = JSON.parse(controlRectsResult.result.value);
  for (const point of controlRects) {
    await call("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  }
  const controlResult = await call("Runtime.evaluate", {
    expression: `(() => {
      const quiet = document.querySelector('#textuary-quiet-front-page').shadowRoot;
      const shell = quiet.querySelector('.qfp-shell');
      return JSON.stringify({
        headlinesOnly: shell.classList.contains('qfp-headlines-only'),
        compact: shell.classList.contains('qfp-compact'),
        detailLabel: quiet.getElementById('qfp-detail').textContent,
        densityLabel: quiet.getElementById('qfp-density').textContent
      });
    })()`,
    returnByValue: true
  });
  controls = JSON.parse(controlResult.result.value);
  assert(controls.headlinesOnly && controls.compact, "view controls did not update the layout");
  assert(controls.detailLabel === "Show summaries", "summary control label did not update");
  assert(controls.densityLabel === "Comfortable view", "density control label did not update");
}

console.log(JSON.stringify({ ...inspection, controls, screenshotPath }, null, 2));
socket.close();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

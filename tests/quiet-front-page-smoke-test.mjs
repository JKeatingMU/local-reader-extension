import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.argv[2] || 9352);
const fixtureUrl = process.argv[3];
const screenshotPath = process.argv[4] || "/private/tmp/quiet-front-page-preview.png";
const mode = process.argv[5] || "fixture";
const viewportWidth = Number(process.argv[6] || 1280);
const viewportHeight = Number(process.argv[7] || 800);
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
  width: viewportWidth,
  height: viewportHeight,
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
    const headline = quiet?.querySelector('.qfp-story h2');
    return JSON.stringify({
      root: Boolean(root && quiet),
      viewMode: root?.dataset.mode || 'landing',
      articleScore: Number(root?.dataset.articleScore || 0),
      title: document.title,
      storyCount: Number(root?.dataset.storyCount),
      cards: quiet?.querySelectorAll('.qfp-story').length || 0,
      images: quiet?.querySelectorAll('.qfp-story img').length || 0,
      media: quiet?.querySelectorAll('.qfp-media').length || 0,
      placeholders: quiet?.querySelectorAll('.qfp-placeholder').length || 0,
      imageSources: [...(quiet?.querySelectorAll('.qfp-story img') || [])].map((image) => image.src),
      links: [...(quiet?.querySelectorAll('.qfp-story h2 a') || [])].map((link) => ({ text: link.textContent.trim(), href: link.href })),
      sections: [...(quiet?.querySelectorAll('.qfp-section') || [])].map((node) => node.textContent.trim()),
      summaries: quiet?.querySelectorAll('.qfp-summary:not(.qfp-summary-muted)').length || 0,
      toolbarButtons: quiet?.querySelectorAll('.qfp-toolbar button').length || 0,
      toolbarMenus: quiet?.querySelectorAll('.qfp-toolbar details').length || 0,
      headlineSize: headline ? parseFloat(getComputedStyle(headline).fontSize) : 0,
      mediaWidth: Math.round(quiet?.querySelector('.qfp-media')?.getBoundingClientRect().width || 0),
      pageWidth: shell?.scrollWidth || 0,
      viewportWidth: innerWidth,
      handoff: Boolean(quiet?.querySelector('.qfp-handoff')),
      handoffTitle: quiet?.querySelector('#qfp-handoff-title')?.textContent || '',
      textuaryAction: quiet?.querySelector('.qfp-textuary-action')?.textContent?.replace(/\\s+/g, ' ').trim() || ''
    });
  })()`,
  returnByValue: true
});
const inspection = JSON.parse(inspectionResult.result.value);

assert(inspection.root, "the quiet view was not rendered");
if (mode === "article") {
  assert(inspection.viewMode === "article", "article page was not classified as an article");
  assert(inspection.articleScore >= 5, `article confidence was too low at ${inspection.articleScore}`);
  assert(inspection.handoff, "Textuary hand-off was not rendered");
  assert(inspection.cards === 0, "article page was incorrectly converted into a story list");
  assert(inspection.handoffTitle === "This looks like an article", "article hand-off heading is missing");
  assert(inspection.textuaryAction.includes("Open in Textuary"), "Textuary hand-off action is missing");

  const screenshot = await call("Page.captureScreenshot", { format: "png" });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
  await call("Runtime.evaluate", {
    expression: `(() => {
      const reader = document.createElement('div');
      reader.id = 'local-reader-view';
      document.documentElement.append(reader);
    })()`,
    returnByValue: true
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  const handoffRemoval = await call("Runtime.evaluate", {
    expression: `!document.querySelector('#textuary-quiet-front-page')`,
    returnByValue: true
  });
  assert(handoffRemoval.result.value, "article hand-off did not yield when Textuary opened");
  await call("Runtime.evaluate", {
    expression: `document.querySelector('#local-reader-view')?.remove()`,
    returnByValue: true
  });
  await call("Runtime.evaluate", { expression: source, awaitPromise: true, returnByValue: true });
  await call("Runtime.evaluate", {
    expression: `document.querySelector('#textuary-quiet-front-page').shadowRoot
      .getElementById('qfp-continue').click()`,
    returnByValue: true
  });
  const continueRemoval = await call("Runtime.evaluate", {
    expression: `!document.querySelector('#textuary-quiet-front-page')`,
    returnByValue: true
  });
  assert(continueRemoval.result.value, "Continue on original page did not dismiss the hand-off");
  console.log(JSON.stringify({ ...inspection, handoffRemoval: true, continueRemoval: true, screenshotPath }, null, 2));
  socket.close();
  process.exit(0);
}

if (mode === "fixture") {
  assert(inspection.storyCount === 6, `expected 6 stories, found ${inspection.storyCount}`);
  assert(inspection.cards === 6, `expected 6 cards, found ${inspection.cards}`);
  assert(inspection.images === 5, `expected 5 story images, found ${inspection.images}`);
  assert(inspection.media === 6, "every fixture story should retain a media column");
  assert(inspection.placeholders === 1, `expected one image placeholder, found ${inspection.placeholders}`);
  assert(inspection.imageSources.some((url) => url.endsWith("/river.svg")), "lazy-loaded river image was not promoted");
  assert(!inspection.imageSources.some((url) => url.endsWith("/placeholder.svg")), "placeholder image survived extraction");
  assert(inspection.links.length === 6, "story links were not deduplicated");
  assert(inspection.links.every(({ href }) => new URL(href).hostname === "127.0.0.1"), "an external link survived extraction");
  assert(inspection.links[0].text.startsWith("A forgotten coastal path"), "editorial order was not preserved");
  assert(!inspection.links[0].text.startsWith("Premium"), "a leading Premium access badge leaked into the headline");
  assert(inspection.links[1].text.startsWith("The city square redesigned"), "the empty overlay link was not paired with its sibling headline");
  assert(new URL(inspection.links[1].href).pathname === "/cities/city-square.html", "the overlay story received the wrong destination");
  assert(!inspection.links.some(({ href }) => href.includes("ambiguous-package")), "an ambiguous overlay card was incorrectly accepted");
  assert(inspection.links.some(({ text, href }) => href.includes("radio-archive") && text.startsWith("Premium recordings")), "a legitimate headline beginning with Premium was altered");
  assert(inspection.links.at(-1).text.startsWith("Citizen scientists"), "last story order changed");
  assert(inspection.sections.length === 6, "fixture stories are missing section labels");
  assert(inspection.sections.every(Boolean), "an empty fixture section label was rendered");
  assert(inspection.summaries === 6, "story summaries were not retained");
  assert(inspection.headlineSize <= 34, `default headline is still oversized at ${inspection.headlineSize}px`);
  if (inspection.viewportWidth >= 900) {
    assert(inspection.mediaWidth <= 330, `default story image is still oversized at ${inspection.mediaWidth}px`);
  }
} else {
  const sourceHost = new URL(fixtureUrl).hostname.replace(/^www\./, "");
  assert(inspection.storyCount >= 8, `expected at least 8 live stories, found ${inspection.storyCount}`);
  assert(inspection.cards === inspection.storyCount, "live story count and card count differ");
  assert(inspection.images >= 4, `expected at least 4 live story images, found ${inspection.images}`);
  assert(inspection.links.length === inspection.storyCount, "live story links were not deduplicated");
  assert(inspection.sections.length === inspection.storyCount, "live stories are missing section labels");
  assert(inspection.links.every(({ href }) => new URL(href).hostname.replace(/^www\./, "") === sourceHost), "a cross-publication link survived extraction");
}
assert(inspection.toolbarButtons === 5, "quiet-view controls are incomplete");
assert(inspection.toolbarMenus === 1, "display menu is missing");
assert(inspection.pageWidth <= inspection.viewportWidth, "quiet view has horizontal overflow");

const screenshot = await call("Page.captureScreenshot", { format: "png" });
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
let placeholderScreenshotPath = null;
let displayScreenshotPath = null;
let smallScreenshotPath = null;
let largeScreenshotPath = null;
let sizeScale = null;

let controls = null;
if (mode === "fixture") {
  await call("Runtime.evaluate", {
    expression: `document.querySelector('#textuary-quiet-front-page').shadowRoot
      .querySelector('.qfp-placeholder').scrollIntoView({ block: 'center' })`,
    returnByValue: true
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  const placeholderScreenshot = await call("Page.captureScreenshot", { format: "png" });
  placeholderScreenshotPath = screenshotPath.replace(/\.png$/i, "-placeholder.png");
  await writeFile(placeholderScreenshotPath, Buffer.from(placeholderScreenshot.data, "base64"));

  await call("Runtime.evaluate", {
    expression: `(() => {
      const quiet = document.querySelector('#textuary-quiet-front-page').shadowRoot;
      quiet.querySelector('.qfp-display').open = true;
    })()`,
    returnByValue: true
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  const displayScreenshot = await call("Page.captureScreenshot", { format: "png" });
  displayScreenshotPath = screenshotPath.replace(/\.png$/i, "-display.png");
  await writeFile(displayScreenshotPath, Buffer.from(displayScreenshot.data, "base64"));

  const smallScaleResult = await call("Runtime.evaluate", {
    expression: `(() => {
      const quiet = document.querySelector('#textuary-quiet-front-page').shadowRoot;
      const font = quiet.getElementById('qfp-font');
      font.value = 'clean';
      font.dispatchEvent(new Event('change', { bubbles: true }));
      const media = quiet.querySelector('.qfp-media');
      const headline = quiet.querySelector('.qfp-story h2');
      quiet.getElementById('qfp-size-down').click();
      quiet.querySelector('.qfp-display').open = false;
      return JSON.stringify({
        mediaWidth: Math.round(media.getBoundingClientRect().width),
        headlineSize: parseFloat(getComputedStyle(headline).fontSize)
      });
    })()`,
    returnByValue: true
  });
  const smallScale = JSON.parse(smallScaleResult.result.value);
  await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  const smallScreenshot = await call("Page.captureScreenshot", { format: "png" });
  smallScreenshotPath = screenshotPath.replace(/\.png$/i, "-small.png");
  await writeFile(smallScreenshotPath, Buffer.from(smallScreenshot.data, "base64"));

  const largeScaleResult = await call("Runtime.evaluate", {
    expression: `(() => {
      const quiet = document.querySelector('#textuary-quiet-front-page').shadowRoot;
      const media = quiet.querySelector('.qfp-media');
      const headline = quiet.querySelector('.qfp-story h2');
      quiet.getElementById('qfp-size-up').click();
      quiet.getElementById('qfp-size-up').click();
      return JSON.stringify({
        mediaWidth: Math.round(media.getBoundingClientRect().width),
        headlineSize: parseFloat(getComputedStyle(headline).fontSize)
      });
    })()`,
    returnByValue: true
  });
  const largeScale = JSON.parse(largeScaleResult.result.value);
  await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  const largeScreenshot = await call("Page.captureScreenshot", { format: "png" });
  largeScreenshotPath = screenshotPath.replace(/\.png$/i, "-large.png");
  await writeFile(largeScreenshotPath, Buffer.from(largeScreenshot.data, "base64"));

  sizeScale = {
    smallMediaWidth: smallScale.mediaWidth,
    smallHeadlineSize: smallScale.headlineSize,
    largeMediaWidth: largeScale.mediaWidth,
    largeHeadlineSize: largeScale.headlineSize
  };
  if (inspection.viewportWidth >= 900) {
    assert(sizeScale.smallMediaWidth < inspection.mediaWidth, "Small did not reduce story-image width");
    assert(sizeScale.largeMediaWidth > inspection.mediaWidth, "Large did not increase story-image width");
  }
  assert(sizeScale.smallHeadlineSize < inspection.headlineSize, "Small did not reduce headline size");
  assert(sizeScale.largeHeadlineSize > inspection.headlineSize, "Large did not increase headline size");
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
        cleanTypeface: shell.classList.contains('qfp-font-clean'),
        largeText: shell.classList.contains('qfp-font-large'),
        detailLabel: quiet.getElementById('qfp-detail').textContent,
        densityLabel: quiet.getElementById('qfp-density').textContent,
        sizeLabel: quiet.getElementById('qfp-size-label').textContent,
        sizeIncreaseDisabled: quiet.getElementById('qfp-size-up').disabled
      });
    })()`,
    returnByValue: true
  });
  controls = JSON.parse(controlResult.result.value);
  assert(controls.headlinesOnly && controls.compact, "view controls did not update the layout");
  assert(controls.cleanTypeface, "typeface control did not update the layout");
  assert(controls.largeText, "text-size control did not update the layout");
  assert(controls.detailLabel === "Show summaries", "summary control label did not update");
  assert(controls.densityLabel === "Comfortable view", "density control label did not update");
  assert(controls.sizeLabel === "Large" && controls.sizeIncreaseDisabled, "text-size state did not update");
}

console.log(JSON.stringify({
  ...inspection,
  controls,
  sizeScale,
  screenshotPath,
  placeholderScreenshotPath,
  displayScreenshotPath,
  smallScreenshotPath,
  largeScreenshotPath
}, null, 2));
socket.close();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

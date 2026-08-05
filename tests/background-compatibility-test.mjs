import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../background.js", import.meta.url), "utf8");

for (const namespace of ["browser", "chrome"]) {
  const calls = [];
  let onClicked;
  const api = {
    action: {
      onClicked: { addListener(listener) { onClicked = listener; } },
      async setBadgeBackgroundColor(options) { calls.push(["badgeColor", options]); },
      async setBadgeText(options) { calls.push(["badgeText", options]); }
    },
    scripting: {
      async executeScript(options) { calls.push(["executeScript", options]); }
    }
  };
  const context = {
    console,
    Promise,
    setTimeout(callback) { callback(); },
    [namespace]: api
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: "background.js" });

  assert.equal(typeof onClicked, "function", `${namespace} action listener`);
  await onClicked({ id: 7, url: "https://example.com/article" });
  assert.deepEqual(
    Array.from(calls.find(([type]) => type === "executeScript")?.[1].files || []),
    ["vendor/Readability.js", "vendor/purify.min.js", "reader.js"],
    `${namespace} script injection`
  );

  calls.length = 0;
  await onClicked({ id: 8, url: "safari-web-extension://settings" });
  assert.ok(
    calls.some(([type, options]) => type === "badgeText" && options.text === "WEB"),
    `${namespace} unsupported-page badge`
  );
}

console.log("Background compatibility: browser and chrome namespaces");

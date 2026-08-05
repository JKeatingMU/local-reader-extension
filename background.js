const extensionApi = globalThis.browser ?? globalThis.chrome;

if (!extensionApi) throw new Error("Local Reader could not find a Web Extensions API");

extensionApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:\/\//i.test(tab.url || "")) {
    await setBadge(tab.id, "WEB", "#6b7280");
    return;
  }

  try {
    await extensionApi.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "vendor/Readability.js",
        "vendor/purify.min.js",
        "reader.js"
      ]
    });
    await setBadge(tab.id, "", "#2563eb");
  } catch (error) {
    console.error("Local Reader could not run", error);
    await setBadge(tab.id, "ERR", "#b91c1c");
  }
});

async function setBadge(tabId, text, color) {
  if (!tabId) return;
  await extensionApi.action.setBadgeBackgroundColor({ tabId, color });
  await extensionApi.action.setBadgeText({ tabId, text });
  if (text) {
    setTimeout(() => {
      void Promise.resolve(extensionApi.action.setBadgeText({ tabId, text: "" })).catch(() => {});
    }, 2500);
  }
}

const extensionApi = globalThis.browser ?? globalThis.chrome;

if (!extensionApi) throw new Error("Quiet Front Page could not find a Web Extensions API");

extensionApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:\/\//i.test(tab.url || "")) {
    await showBadge(tab.id, "WEB", "#6b7280");
    return;
  }

  try {
    await extensionApi.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["quiet.js"]
    });
    await showBadge(tab.id, "", "#2563eb");
  } catch (error) {
    console.error("Quiet Front Page could not run", error);
    await showBadge(tab.id, "ERR", "#b91c1c");
  }
});

async function showBadge(tabId, text, color) {
  if (!tabId) return;
  await extensionApi.action.setBadgeBackgroundColor({ tabId, color });
  await extensionApi.action.setBadgeText({ tabId, text });
  if (!text) return;
  setTimeout(() => {
    void Promise.resolve(extensionApi.action.setBadgeText({ tabId, text: "" })).catch(() => {});
  }, 2500);
}

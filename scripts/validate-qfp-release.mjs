import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const sourceRoot = resolve("prototypes/quiet-front-page");
const manifest = JSON.parse(await readFile(resolve(sourceRoot, "manifest.json"), "utf8"));

assert(manifest.manifest_version === 3, "Quiet Front Page must use Manifest V3");
assert(manifest.name === "Quiet Front Page — Clean News Homepages", "unexpected public extension name");
assert(manifest.short_name === "Quiet Front Page", "unexpected short extension name");
assert(manifest.version === "1.0.0", "Quiet Front Page release version must be 1.0.0");
assert(manifest.description === "Turn busy newspaper home and section pages into calm, ordered story lists with original links.", "unexpected manifest description");
assert(JSON.stringify([...manifest.permissions].sort()) === JSON.stringify(["activeTab", "scripting"]), "permissions must be exactly activeTab and scripting");
assert(!("host_permissions" in manifest), "host permissions are not allowed");
assert(!("optional_host_permissions" in manifest), "optional host permissions are not allowed");
assert(!("content_scripts" in manifest), "persistent content scripts are not allowed");
assert(!manifest.permissions.includes("storage"), "Quiet Front Page must not request storage");
assert(manifest.background?.service_worker === "background.js", "background service worker is missing");
assert(manifest.action?.default_title === "Open Quiet Front Page", "toolbar title is incorrect");
assert(manifest.commands?._execute_action?.suggested_key?.default === "Alt+Shift+F", "keyboard shortcut is incorrect");

const runtimePaths = [
  "manifest.json",
  "background.js",
  "quiet.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png"
];
for (const path of runtimePaths) {
  const details = await stat(resolve(sourceRoot, path));
  assert(details.isFile() && details.size > 0, `missing or empty runtime file: ${path}`);
}

const runtimeText = [
  await readFile(resolve(sourceRoot, "manifest.json"), "utf8"),
  await readFile(resolve(sourceRoot, "background.js"), "utf8"),
  await readFile(resolve(sourceRoot, "quiet.js"), "utf8")
].join("\n");
assert(!/Textuary Lab/i.test(runtimeText), "prototype Textuary Lab identity remains in the runtime");
assert(!/experimental local Textuary view/i.test(runtimeText), "experimental footer remains in the runtime");

const xcodeProject = await readFile(resolve("safari/QuietFrontPage/Quiet Front Page/Quiet Front Page.xcodeproj/project.pbxproj"), "utf8");
assert((xcodeProject.match(/MARKETING_VERSION = 1\.0\.0;/g) || []).length === 8, "Safari wrapper versions are not all 1.0.0");
assert(xcodeProject.includes("com.jgkeating.quietfrontpage.Extension"), "Safari extension bundle identifier changed");

const listing = await readFile(resolve("store/qfp/LISTING.md"), "utf8");
assert(listing.includes(manifest.name), "store listing name differs from the manifest");
assert(listing.includes(manifest.description), "store listing summary differs from the manifest");
assert(listing.includes("QUIET_FRONT_PAGE_PRIVACY.md"), "store listing privacy URL is missing");

console.log("Quiet Front Page release identity, permissions, runtime inventory and Safari version are valid");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

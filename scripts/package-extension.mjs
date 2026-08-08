import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceManifest = JSON.parse(await readFile(join(projectRoot, "manifest.json"), "utf8"));
const version = sourceManifest.version;

if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) {
  throw new Error(`Unsafe extension version: ${version}`);
}

const outputRoot = join(projectRoot, "dist", "chrome");
const stageRoot = join(outputRoot, `textuary-${version}`);
const archivePath = join(outputRoot, `textuary-${version}.zip`);

if (!stageRoot.startsWith(`${outputRoot}${sep}`)) {
  throw new Error("Refusing to stage outside the Chrome distribution directory");
}

const packageFiles = [
  "background.js",
  "library.css",
  "library.html",
  "library.js",
  "print.css",
  "reader.js",
  "saved.html",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128-store.png",
  "vendor/Readability.js",
  "vendor/purify.min.js",
  "vendor/kokoro.web.js",
  "vendor/ort-wasm-simd-threaded.jsep.mjs",
  "vendor/ort-wasm-simd-threaded.jsep.wasm",
  "vendor/LICENSE-readability.md",
  "vendor/LICENSE-dompurify.txt",
  "vendor/LICENSE-kokoro-js.txt",
  "vendor/LICENSE-transformers-js.txt",
  "vendor/LICENSE-phonemizer.txt",
  "vendor/LICENSE-onnxruntime.txt"
];

await rm(stageRoot, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(stageRoot, { recursive: true });

const chromeManifest = structuredClone(sourceManifest);
delete chromeManifest.browser_specific_settings;
await writeFile(join(stageRoot, "manifest.json"), `${JSON.stringify(chromeManifest, null, 2)}\n`);

for (const path of packageFiles) {
  const source = join(projectRoot, path);
  const destination = join(stageRoot, path);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

const stagedFiles = await listFiles(stageRoot);
const expectedFiles = ["manifest.json", ...packageFiles].sort();
if (JSON.stringify(stagedFiles) !== JSON.stringify(expectedFiles)) {
  throw new Error(`Unexpected staged files:\n${stagedFiles.join("\n")}`);
}

for (const path of stagedFiles) {
  const details = await stat(join(stageRoot, path));
  if (!details.isFile() || details.size === 0) throw new Error(`Invalid staged file: ${path}`);
}

await run("zip", ["-X", "-q", "-r", archivePath, "."], stageRoot);
const archive = await readFile(archivePath);
if (archive.length < 4 || archive[0] !== 0x50 || archive[1] !== 0x4b) {
  throw new Error("Chrome package is not a valid ZIP archive");
}

console.log(`Chrome extension staged at ${relative(projectRoot, stageRoot)}`);
console.log(`Chrome Web Store ZIP: ${relative(projectRoot, archivePath)} (${archive.length.toLocaleString()} bytes)`);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const child of await listFiles(absolute)) files.push(join(entry.name, child));
    } else if (entry.isFile()) {
      files.push(entry.name);
    }
  }
  return files.sort();
}

function run(command, args, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", rejectRun);
    child.once("exit", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with status ${code}`));
    });
  });
}

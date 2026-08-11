import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "prototypes", "quiet-front-page");
const sourceManifest = JSON.parse(await readFile(join(sourceRoot, "manifest.json"), "utf8"));
const version = sourceManifest.version;

if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) {
  throw new Error(`Unsafe Quiet Front Page version: ${version}`);
}

const outputRoot = join(projectRoot, "dist", "chrome");
const stageRoot = join(outputRoot, `quiet-front-page-${version}`);
const archivePath = join(outputRoot, `quiet-front-page-${version}.zip`);
const archiveTimestamp = new Date("2000-01-01T00:00:00.000Z");

if (!stageRoot.startsWith(`${outputRoot}${sep}`)) {
  throw new Error("Refusing to stage outside the Chrome distribution directory");
}

const packageFiles = [
  "background.js",
  "quiet.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png"
];

await rm(stageRoot, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(stageRoot, { recursive: true });

const chromeManifest = structuredClone(sourceManifest);
delete chromeManifest.browser_specific_settings;
await writeFile(join(stageRoot, "manifest.json"), `${JSON.stringify(chromeManifest, null, 2)}\n`);

for (const path of packageFiles) {
  const source = join(sourceRoot, path);
  const destination = join(stageRoot, path);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

const stagedFiles = await listFiles(stageRoot);
const expectedFiles = ["manifest.json", ...packageFiles].sort();
if (JSON.stringify(stagedFiles) !== JSON.stringify(expectedFiles)) {
  throw new Error(`Unexpected Quiet Front Page staged files:\n${stagedFiles.join("\n")}`);
}

for (const path of stagedFiles) {
  const details = await stat(join(stageRoot, path));
  if (!details.isFile() || details.size === 0) throw new Error(`Invalid staged file: ${path}`);
  await utimes(join(stageRoot, path), archiveTimestamp, archiveTimestamp);
}

const stagedManifest = JSON.parse(await readFile(join(stageRoot, "manifest.json"), "utf8"));
if ("browser_specific_settings" in stagedManifest) {
  throw new Error("Chrome package retained Safari-only manifest metadata");
}
if (stagedManifest.name !== "Quiet Front Page — Clean News Homepages" || stagedManifest.version !== version) {
  throw new Error("Chrome package identity does not match the release source");
}

await run("zip", ["-X", "-q", archivePath, ...expectedFiles], stageRoot);
const archive = await readFile(archivePath);
if (archive.length < 4 || archive[0] !== 0x50 || archive[1] !== 0x4b) {
  throw new Error("Quiet Front Page Chrome package is not a valid ZIP archive");
}

const checksum = createHash("sha256").update(archive).digest("hex");
console.log(`Quiet Front Page staged at ${relative(projectRoot, stageRoot)}`);
console.log(`Chrome Web Store ZIP: ${relative(projectRoot, archivePath)} (${archive.length.toLocaleString()} bytes)`);
console.log(`SHA-256: ${checksum}`);

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
    const child = spawn(command, args, { cwd, stdio: "inherit", env: { ...process.env, TZ: "UTC" } });
    child.once("error", rejectRun);
    child.once("exit", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with status ${code}`));
    });
  });
}

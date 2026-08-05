import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const vendor = resolve(root, "vendor");
await mkdir(vendor, { recursive: true });

const readabilitySource = resolve(root, "node_modules/@mozilla/readability/Readability.js");
const purifySource = resolve(root, "node_modules/dompurify/dist/purify.min.js");

const readability = await readFile(readabilitySource, "utf8");
const purify = await readFile(purifySource, "utf8");

await writeFile(
  resolve(vendor, "Readability.js"),
  `/* @mozilla/readability 0.6.0 — Apache-2.0 */\n${readability}`
);
await writeFile(
  resolve(vendor, "purify.min.js"),
  `/* DOMPurify 3.4.13 — MPL-2.0 OR Apache-2.0 */\n${purify}`
);

await copyFile(
  resolve(root, "node_modules/@mozilla/readability/LICENSE.md"),
  resolve(vendor, "LICENSE-readability.md")
);
await copyFile(
  resolve(root, "node_modules/dompurify/LICENSE"),
  resolve(vendor, "LICENSE-dompurify.txt")
);

console.log("Vendored Readability 0.6.0 and DOMPurify 3.4.13");

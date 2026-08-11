import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const assets = [
  ["store/qfp/assets/store-icon-128.png", 128, 128],
  ["store/qfp/assets/qfp-editorial-1280x800.png", 1280, 800],
  ["store/qfp/assets/qfp-display-1280x800.png", 1280, 800],
  ["store/qfp/assets/qfp-compact-1280x800.png", 1280, 800],
  ["store/qfp/assets/promo-small-440x280.png", 440, 280]
];

for (const [path, expectedWidth, expectedHeight] of assets) {
  const image = await readFile(resolve(path));
  const isPng = image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng) throw new Error(`${path} is not a PNG file`);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`${path} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}`);
  }
}

console.log(`Quiet Front Page store assets: ${assets.length} PNG files have the required dimensions`);

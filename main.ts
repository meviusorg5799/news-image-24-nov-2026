import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024; // 1 MiB

const scriptDir = dirname(fileURLToPath(import.meta.url));
const source = join(scriptDir, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

if (!existsSync(source)) {
  throw new Error(`entry.png not found next to main.ts: ${source}`);
}

const size = statSync(source).size;
if (size > MAX_BYTES) {
  throw new Error(
    `entry.png is ${size} bytes, over the 1 MiB limit (${MAX_BYTES} bytes)`,
  );
}

// The gate tells PNG from JPEG by the first bytes, so fail loudly here
// instead of submitting a file the gate would refuse.
const head = readFileSync(source, { flag: "r" }).subarray(0, 8);
const isPng = head.subarray(0, 8).equals(
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
);
const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error(
    "entry.png is neither a PNG nor a JPEG (unrecognised magic bytes)",
  );
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, join(outDir, "entry.png"));
console.log(`Wrote ${join(outDir, "entry.png")} (${size} bytes)`);

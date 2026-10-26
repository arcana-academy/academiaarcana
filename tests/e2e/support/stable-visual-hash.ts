import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

import type { Locator } from "@playwright/test";

type DecodedPng = {
  width: number;
  height: number;
  channels: 3 | 4;
  pixels: Buffer;
};

type SpatialFingerprint = {
  height: number;
  pixels: Buffer;
};

const PNG_SIGNATURE = "89504e470d0a1a0a";

function paethPredictor(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

/** Decode the non-interlaced RGB/RGBA PNGs emitted by Playwright screenshots. */
function decodeScreenshotPng(bytes: Buffer): DecodedPng {
  if (bytes.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error("Visual evidence is not a PNG screenshot.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let compressionMethod = -1;
  let filterMethod = -1;
  let interlaceMethod = -1;
  const compressedChunks: Buffer[] = [];

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) {
      throw new Error(`Truncated PNG chunk: ${type}`);
    }
    const data = bytes.subarray(dataStart, dataEnd);
    offset = dataEnd + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      compressionMethod = data[10];
      filterMethod = data[11];
      interlaceMethod = data[12];
    } else if (type === "IDAT") {
      compressedChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (
    width <= 0 ||
    height <= 0 ||
    bitDepth !== 8 ||
    (colorType !== 2 && colorType !== 6) ||
    compressionMethod !== 0 ||
    filterMethod !== 0 ||
    interlaceMethod !== 0 ||
    compressedChunks.length === 0
  ) {
    throw new Error(
      `Unsupported Playwright PNG format: ${width}x${height}, depth=${bitDepth}, color=${colorType}, interlace=${interlaceMethod}`,
    );
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const filtered = inflateSync(Buffer.concat(compressedChunks));
  const expectedLength = height * (stride + 1);
  if (filtered.length !== expectedLength) {
    throw new Error(
      `Unexpected PNG payload length: received ${filtered.length}, expected ${expectedLength}`,
    );
  }

  const pixels = Buffer.allocUnsafe(width * height * channels);
  let sourceOffset = 0;
  let previousRow: Buffer | undefined;

  for (let y = 0; y < height; y += 1) {
    const filter = filtered[sourceOffset];
    sourceOffset += 1;
    const row = pixels.subarray(y * stride, (y + 1) * stride);

    for (let x = 0; x < stride; x += 1) {
      const encoded = filtered[sourceOffset];
      sourceOffset += 1;
      const left = x >= channels ? row[x - channels] : 0;
      const up = previousRow?.[x] ?? 0;
      const upperLeft = previousRow && x >= channels
        ? previousRow[x - channels]
        : 0;

      let reconstructed: number;
      switch (filter) {
        case 0:
          reconstructed = encoded;
          break;
        case 1:
          reconstructed = encoded + left;
          break;
        case 2:
          reconstructed = encoded + up;
          break;
        case 3:
          reconstructed = encoded + Math.floor((left + up) / 2);
          break;
        case 4:
          reconstructed = encoded + paethPredictor(left, up, upperLeft);
          break;
        default:
          throw new Error(`Unsupported PNG row filter: ${filter}`);
      }
      row[x] = reconstructed & 0xff;
    }
    previousRow = row;
  }

  return { width, height, channels, pixels };
}

/**
 * Area-average the screenshot into a small spatial fingerprint. This removes
 * isolated 1-LSB Skia differences at fractional rounded edges while retaining
 * layout, copy, and palette changes. The second, coarser-color pass preserves
 * more spatial detail without reintroducing those rasterization flakes.
 */
function spatialFingerprint(
  image: DecodedPng,
  targetWidth: number,
  colorQuantum: number,
): SpatialFingerprint {
  const targetHeight = Math.max(
    1,
    Math.round((image.height * targetWidth) / image.width),
  );
  const cellCount = targetWidth * targetHeight;
  const red = new Float64Array(cellCount);
  const green = new Float64Array(cellCount);
  const blue = new Float64Array(cellCount);
  const counts = new Uint32Array(cellCount);

  for (let y = 0; y < image.height; y += 1) {
    const targetY = Math.min(
      targetHeight - 1,
      Math.floor((y * targetHeight) / image.height),
    );
    for (let x = 0; x < image.width; x += 1) {
      const targetX = Math.min(
        targetWidth - 1,
        Math.floor((x * targetWidth) / image.width),
      );
      const cell = targetY * targetWidth + targetX;
      const source = (y * image.width + x) * image.channels;
      const alpha = image.channels === 4 ? image.pixels[source + 3] : 255;

      // Composite transparent pixels against the white background Playwright
      // uses for an ordinary screenshot before calculating the area average.
      red[cell] += (
        image.pixels[source] * alpha + 255 * (255 - alpha)
      ) / 255;
      green[cell] += (
        image.pixels[source + 1] * alpha + 255 * (255 - alpha)
      ) / 255;
      blue[cell] += (
        image.pixels[source + 2] * alpha + 255 * (255 - alpha)
      ) / 255;
      counts[cell] += 1;
    }
  }

  const fingerprint = Buffer.allocUnsafe(cellCount * 3);
  for (let cell = 0; cell < cellCount; cell += 1) {
    const output = cell * 3;
    fingerprint[output] = Math.round(
      red[cell] / counts[cell] / colorQuantum,
    );
    fingerprint[output + 1] = Math.round(
      green[cell] / counts[cell] / colorQuantum,
    );
    fingerprint[output + 2] = Math.round(
      blue[cell] / counts[cell] / colorQuantum,
    );
  }

  return { height: targetHeight, pixels: fingerprint };
}

export function stableVisualHash(bytes: Buffer): string {
  const image = decodeScreenshotPng(bytes);
  const palette = spatialFingerprint(image, 16, 8);
  const detail = spatialFingerprint(image, 64, 128);
  const hash = createHash("sha256");
  hash.update(
    `academia-arcana-visual-v2|source:${image.width}x${image.height}|palette:16x${palette.height}:q8|`,
  );
  hash.update(palette.pixels);
  hash.update(`|detail:64x${detail.height}:q128|`);
  hash.update(detail.pixels);
  return `v2:${hash.digest("hex")}`;
}

export async function captureStableVisualHash(
  locator: Locator,
): Promise<{ hash: string; bytes: Buffer }> {
  const bytes = await locator.screenshot({
    animations: "disabled",
    caret: "hide",
  });
  return { hash: stableVisualHash(bytes), bytes };
}

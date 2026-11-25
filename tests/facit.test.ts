/**
 * Facit tests ("golden master").
 *
 * For every ROM file in the ROM folder, this test decodes everything the
 * library can decode today and compares a fingerprint of each result with a
 * saved facit file in tests/facit/. If a single pixel in a single image
 * changes, the test fails and the diff shows which image it was.
 *
 * Facit files are named after the first 10 characters of the ROM's SHA-1, so
 * the ROM files can be named anything. tests/facit/README.md lists which game
 * each file belongs to.
 *
 * ROM files are copyrighted and are NOT stored in the repository. Put them in
 * ./roms (ignored by git) or point WPCEDIT_ROMS to another folder. ROMs that
 * are missing are skipped.
 *
 * To regenerate the facit after an intended change: npm run test:update
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { WPCEdit } from "../src/WPCEdit.js";
import { ROM } from "../src/stores/ROM.js";
import { FullFrameImageData } from "../src/stores/FullFrameImageData.js";
import { VariableSizedImageData } from "../src/stores/VariableSizedImageData.js";
import type { Plane } from "../src/resources/Plane.js";

const romDir = resolve(process.env.WPCEDIT_ROMS ?? join(__dirname, "..", "roms"));
const facitDir = join(__dirname, "facit");

const romFiles = existsSync(romDir)
  ? readdirSync(romDir).filter((name) => !name.startsWith(".")).sort()
  : [];

const hex = (value: number) => "0x" + value.toString(16);

function fingerprint(...parts: (Uint8Array | number)[]): string {
  const hash = createHash("sha1");
  for (const part of parts) {
    hash.update(part instanceof Uint8Array ? part : String(part) + ";");
  }
  return hash.digest("hex").slice(0, 12);
}

function planeFingerprint(plane: Plane): string {
  return fingerprint(
    plane.image,
    plane.mask,
    plane.xor,
    plane.flags,
    plane.width,
    plane.height,
    plane.xOffset,
    plane.yOffset,
    plane.type,
    plane.address
  );
}

function describeRom(data: Uint8Array) {
  WPCEdit.init();
  const status = WPCEdit.setRom(data);

  const summary = {
    romSha1: createHash("sha1").update(data).digest("hex"),
    status,
    size: hex(ROM.size),
    basePage: hex(ROM.basePageIndex),
    fontTableAddress: hex(VariableSizedImageData.TableAddress),
    graphicsTableAddress: hex(FullFrameImageData.TableAddress),
    checksum: {
      valid: WPCEdit.checksum.isValid,
      stored: hex(WPCEdit.checksum.stored),
      calculated: hex(WPCEdit.checksum.calculated),
      delta: hex(WPCEdit.checksum.delta),
    },
    fontCount: ROM.vSImageTableMap.length,
    fullFrameCount: 0,
  };

  // Variable sized images (fonts and sprites): one line per font.
  const fonts: string[] = [];
  ROM.vSImageTableMap.forEach((indices, table) => {
    const glyphs = indices.map((index) =>
      planeFingerprint(WPCEdit.variableSizedImage.getImageAt(table, index))
    );
    const ranges = indices.length
      ? `${hex(indices[0])}-${hex(indices[indices.length - 1])}`
      : "empty";
    fonts.push(`font ${table} (${indices.length} chars, ${ranges}): ${glyphs.join(" ")}`);
  });

  // Full frame images: one line per image.
  const maxIndex = WPCEdit.fullFrameImage.maxImageIndex;
  summary.fullFrameCount = maxIndex;
  const fullFrames: string[] = [];
  for (let index = 0; index < maxIndex; index++) {
    const plane = WPCEdit.fullFrameImage.getPlaneAt(index);
    fullFrames.push(`${index}: ${planeFingerprint(plane)}`);
  }

  return [
    JSON.stringify(summary, null, 2),
    "",
    "# Fonts",
    ...fonts,
    "",
    "# Full frame images",
    ...fullFrames,
    "",
  ].join("\n");
}

describe("facit", () => {
  if (romFiles.length === 0) {
    test.skip(`no ROM files found in ${romDir}`, () => {});
    return;
  }

  for (const name of romFiles) {
    test(name, async () => {
      const data = new Uint8Array(readFileSync(join(romDir, name)));
      const id = createHash("sha1").update(data).digest("hex").slice(0, 10);
      await expect(describeRom(data)).toMatchFileSnapshot(
        join(facitDir, `${id}.txt`)
      );
    });
  }
});

/**
 * placeInFullFrame draws a font or sprite image (a variable sized plane)
 * into a 128 x 32 full frame image at a given position. The parts that end
 * up outside the full frame must be cut off, and the pixels around the
 * sprite must be kept. The result is compared with a simple pixel by pixel
 * version of the same thing.
 *
 * Pixel x of a row is bit x % 8 of byte x / 8, like everywhere in WPC Edit.
 */
import { describe, expect, test } from "vitest";
import { WPCEdit } from "../src/WPCEdit.js";
import type { Plane } from "../src/resources/Plane.js";

const cols = 128;
const rows = 32;

const getPixel = (image: Uint8Array, width: number, x: number, y: number) =>
  (image[y * Math.ceil(width / 8) + (x >> 3)] >> (x & 7)) & 1;

function setPixel(image: Uint8Array, width: number, x: number, y: number, on: number) {
  const index = y * Math.ceil(width / 8) + (x >> 3);
  image[index] = on ? image[index] | (1 << (x & 7)) : image[index] & ~(1 << (x & 7));
}

// A made-up sprite with a fixed pseudo-random pattern
function makeSprite(width: number, height: number, seed: number): Plane {
  const image = new Uint8Array(Math.ceil(width / 8) * height);
  let value = seed;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      value = (value * 1103515245 + 12345) & 0x7fffffff;
      setPixel(image, width, x, y, (value >> 16) & 1);
    }
  }
  const empty = new Uint8Array(0);
  return {
    width, height, image, mask: empty, xor: empty, flags: empty,
    xOffset: 0, yOffset: 0, type: 0, address: 0, tableAddress: 0,
  };
}

// A full frame background with every other pixel lit, so that we can see
// that the pixels around the sprite are kept
function makeBackground() {
  return new Uint8Array(cols * rows / 8).fill(0x55);
}

// What the result should be, worked out one pixel at a time
function expected(sprite: Plane, xOffset: number, yOffset: number, background: Uint8Array) {
  const result = Uint8Array.from(background);
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const destX = xOffset + x;
      const destY = yOffset + y;
      if (destX >= 0 && destX < cols && destY >= 0 && destY < rows) {
        setPixel(result, cols, destX, destY, getPixel(sprite.image, sprite.width, x, y));
      }
    }
  }
  return result;
}

const place = (sprite: Plane, x: number, y: number, background: Uint8Array) =>
  WPCEdit.variableSizedImage.placeInFullFrame(sprite, x, y, Uint8Array.from(background));

describe("placeInFullFrame", () => {
  test("places a sprite inside the full frame", () => {
    const sprite = makeSprite(8, 2, 1);
    for (const [x, y] of [[0, 0], [3, 5], [60, 15], [120, 30]]) {
      expect(place(sprite, x, y, makeBackground())).toEqual(expected(sprite, x, y, makeBackground()));
    }
  });

  test("cuts the sprite off at the right edge instead of drawing it on the next row", () => {
    const sprite = makeSprite(8, 2, 1);
    const result = place(sprite, 125, 5, new Uint8Array(cols * rows / 8));
    // Nothing may be drawn at the start of row 6 or 7
    expect(result[6 * 16]).toBe(0);
    expect(result[7 * 16]).toBe(0);
    expect(result).toEqual(expected(sprite, 125, 5, new Uint8Array(cols * rows / 8)));
  });

  test("cuts the sprite off at the left edge", () => {
    const sprite = makeSprite(10, 3, 2);
    for (const x of [-1, -3, -8, -9]) {
      expect(place(sprite, x, 4, makeBackground())).toEqual(expected(sprite, x, 4, makeBackground()));
    }
  });

  test("cuts the sprite off at the top and bottom edges", () => {
    const sprite = makeSprite(12, 6, 3);
    for (const y of [-2, -5, 28, 31]) {
      expect(place(sprite, 40, y, makeBackground())).toEqual(expected(sprite, 40, y, makeBackground()));
    }
  });

  test("draws nothing when the sprite is entirely outside", () => {
    const sprite = makeSprite(8, 4, 4);
    for (const [x, y] of [[128, 0], [-8, 0], [0, 32], [0, -4], [200, 40]]) {
      expect(place(sprite, x, y, makeBackground())).toEqual(makeBackground());
    }
  });

  test("matches the pixel by pixel version for many sizes and positions", () => {
    for (const width of [1, 3, 7, 8, 9, 15, 16, 17, 24]) {
      for (const height of [1, 4]) {
        const sprite = makeSprite(width, height, width * 31 + height);
        for (let x = -width - 1; x <= cols + 1; x++) {
          for (const y of [-height, -1, 0, 13, rows - height, rows - 1, rows]) {
            expect(place(sprite, x, y, makeBackground()), `width ${width}, height ${height}, x ${x}, y ${y}`)
              .toEqual(expected(sprite, x, y, makeBackground()));
          }
        }
      }
    }
  });

  test("creates an empty full frame when none is given", () => {
    const sprite = makeSprite(8, 2, 5);
    const result = WPCEdit.variableSizedImage.placeInFullFrame(sprite, 10, 10);
    expect(result).toEqual(expected(sprite, 10, 10, new Uint8Array(cols * rows / 8)));
  });
});

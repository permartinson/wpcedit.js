/**
 * size is the number of ROM bytes a full frame image takes up,
 * including its type byte, like size in the original WPC Edit.
 * This test uses a made-up ROM with one graphics table entry.
 */
import { describe, expect, test } from "vitest";
import { ROM } from "../src/stores/ROM.js";
import { DmdDecoder } from "../src/classes/DmdDecoder.js";
import { FullFrameImageData } from "../src/stores/FullFrameImageData.js";

const tableAddress = 0x100;
const imageAddress = 0x38010; // WPC address 0x8010 in non-banked ROM (256 KB ROM)

function decodeImage(image: number[]) {
  const data = new Uint8Array(0x40000);
  data.set([0x80, 0x10, 0xff], tableAddress); // graphics table entry 0 -> 0x8010
  data.set(image, imageAddress);
  ROM.setRom(data);
  FullFrameImageData.init();
  FullFrameImageData.tableAddress = tableAddress;
  DmdDecoder.decodeFullFrameGraphic(0);
  return FullFrameImageData.planes.plane0;
}

describe("size", () => {
  test("counts the bytes of a simple repeats image (0x02)", () => {
    // type, special flag byte, then: 0x11, 255 x 0x55, 255 x 0x66, 0x77 = 512 bytes
    const plane = decodeImage([
      0x02, 0xaa, 0x11, 0xaa, 0xff, 0x55, 0xaa, 0xff, 0x66, 0x77,
    ]);
    expect(plane.data[0]).toBe(0x11);
    expect(plane.data[1]).toBe(0x55);
    expect(plane.data[256]).toBe(0x66);
    expect(plane.data[511]).toBe(0x77);
    expect(plane.size).toBe(10);
  });

  test("counts the bytes of a raw image (0x00)", () => {
    const plane = decodeImage([0x00, ...new Array(512).fill(0x0f)]);
    expect(plane.size).toBe(513);
  });
});

/**
 * Unit tests for the small helper classes that replace the C pointers:
 * RomReader, BitReader and PlaneWriter. They use a made-up ROM, so they run
 * without any real ROM files.
 */
import { describe, expect, test } from "vitest";
import { ROM } from "../src/stores/ROM.js";
import { RomReader } from "../src/classes/RomReader.js";
import { BitReader } from "../src/classes/BitReader.js";
import { PlaneWriter } from "../src/classes/PlaneWriter.js";
import { WriteTypes } from "../src/resources/Constants.js";

function loadRom(bytes: number[]) {
  const data = new Uint8Array(0x40000);
  data.set(bytes);
  ROM.setRom(data);
}

describe("RomReader", () => {
  test("reads bytes and moves forward", () => {
    loadRom([0x11, 0x22, 0x33]);
    const src = new RomReader(0);
    expect(src.peek()).toBe(0x11);
    expect(src.u8()).toBe(0x11);
    expect(src.u8()).toBe(0x22);
    expect(src.pos).toBe(2);
    src.skip();
    expect(src.pos).toBe(3);
  });

  test("knows when it reaches the end of the ROM", () => {
    loadRom([]);
    const src = new RomReader(ROM.endPtr - 1);
    expect(src.atEnd).toBe(false);
    src.u8();
    expect(src.atEnd).toBe(true);
  });

  test("shares its position with every function that gets it", () => {
    loadRom([1, 2, 3, 4]);
    const src = new RomReader(0);
    const readTwo = (reader: RomReader) => reader.u8() + reader.u8();
    expect(readTwo(src)).toBe(3);
    expect(src.u8()).toBe(3);
  });
});

describe("BitReader", () => {
  test("reads a plain 8-bit value after a 0 bit", () => {
    // 0 1010101 1 ... -> value 0b10101011
    loadRom([0b01010101, 0b11000000]);
    const src = new RomReader(0);
    const bits = new BitReader(src, [0, 0, 0, 0, 0, 0, 0, 0]);
    expect(bits.readValue()).toBe(0b10101011);
    expect(src.pos).toBe(1);
    expect(bits.atByteStart).toBe(false);
  });

  test("uses the repeat bytes after an extension bit", () => {
    // 1 0 -> repeat byte 0; 1 1 1 0 -> repeat byte 2; 1 1111111 -> repeat byte 7
    loadRom([0b10111011, 0b11111100]);
    const src = new RomReader(0);
    const bits = new BitReader(src, [10, 11, 12, 13, 14, 15, 16, 17]);
    expect(bits.readValue()).toBe(10);
    expect(bits.readValue()).toBe(12);
    expect(bits.readValue()).toBe(17);
  });

  test("moves the RomReader one byte forward per 8 bits", () => {
    loadRom([0xff, 0x00]);
    const src = new RomReader(0);
    const bits = new BitReader(src, []);
    for (let i = 0; i < 8; i++) {
      expect(bits.readBit()).not.toBe(0);
    }
    expect(src.pos).toBe(1);
    expect(bits.atByteStart).toBe(true);
  });
});

describe("PlaneWriter", () => {
  test("writes rows left to right", () => {
    const out = PlaneWriter.fullFrame(WriteTypes.Rows);
    out.write(1);
    out.write(2);
    expect(out.data[0]).toBe(1);
    expect(out.data[1]).toBe(2);
    expect(out.count).toBe(2);
  });

  test("writes columns top to bottom, then moves to the next column", () => {
    const out = PlaneWriter.fullFrame(WriteTypes.Columns);
    for (let i = 0; i < 33; i++) {
      out.write(i + 1);
    }
    expect(out.data[0]).toBe(1); // row 0, column 0
    expect(out.data[16]).toBe(2); // row 1, column 0
    expect(out.data[31 * 16]).toBe(32); // row 31, column 0
    expect(out.data[1]).toBe(33); // row 0, column 1
  });

  test("is full after 512 bytes", () => {
    const out = PlaneWriter.fullFrame(WriteTypes.Columns);
    for (let i = 0; i < 511; i++) {
      out.write(0xaa);
    }
    expect(out.full).toBe(false);
    out.write(0xbb);
    expect(out.full).toBe(true);
    expect(out.data[511]).toBe(0xbb);
    expect(out.data.every((value) => value != 0)).toBe(true);
  });

  test("supports other sizes than a full frame", () => {
    const out = new PlaneWriter(new Uint8Array(6), WriteTypes.Rows, 12, 3);
    expect(out.capacity).toBe(6);
  });
});

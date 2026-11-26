/**
 * Unit tests for DataParser, with a made-up 256 KB ROM. In a 256 KB ROM the
 * non-banked WPC addresses 0x8000-0xFFFF are at ROM positions 0x38000-0x3FFFF.
 */
import { describe, expect, test } from "vitest";
import { ROM } from "../src/stores/ROM.js";
import { DataParser } from "../src/classes/DataParser.js";
import { HitTypes } from "../src/resources/Constants.js";

function loadRom(pointers: [number, number[]][]) {
  const data = new Uint8Array(0x40000);
  for (const [pos, bytes] of pointers) {
    data.set(bytes, pos);
  }
  ROM.setRom(data);
}

// processHitType() is private; this gives the tests access to it.
const processHitType = (hitType: number, hitTablePtr: number) =>
  (
    DataParser as unknown as {
      processHitType(t: number, p: number, pp: number, ptr: number): number | null;
    }
  ).processHitType(hitType, hitTablePtr, hitTablePtr + 2, hitTablePtr);

describe("processHitType", () => {
  // 0x38000 -> 0x8100 (0x38100) -> 0x8200 (0x38200) -> 0x8300 (0x38300)
  const chain: [number, number[]][] = [
    [0x38000, [0x81, 0x00, 0xff]],
    [0x38100, [0x82, 0x00, 0xff]],
    [0x38200, [0x83, 0x00, 0xff]],
  ];

  test("Addr: follows one pointer", () => {
    loadRom(chain);
    expect(processHitType(HitTypes.Addr, 0x38200)).toBe(0x38300);
  });

  test("AddrAddr: follows two pointers", () => {
    loadRom(chain);
    expect(processHitType(HitTypes.AddrAddr, 0x38100)).toBe(0x38300);
  });

  test("AddrAddrAddr: follows three pointers", () => {
    loadRom(chain);
    expect(processHitType(HitTypes.AddrAddrAddr, 0x38000)).toBe(0x38300);
  });

  test("returns null when a pointer is not a valid WPC address", () => {
    loadRom([[0x38000, [0x12, 0x34, 0x00]]]);
    expect(processHitType(HitTypes.Addr, 0x38000)).toBeNull();
  });
});

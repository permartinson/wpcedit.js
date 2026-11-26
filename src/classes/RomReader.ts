import { ROM } from "../stores/ROM.js";

/**
 * Reads bytes from the ROM and remembers its position.
 *
 * This replaces the `unsigned char **SourcePtr` arguments in DMD.cpp. In C,
 * several functions share one read position by passing a pointer to a
 * pointer. Here they share one `RomReader` object instead, so a function that
 * reads three bytes moves the position for its caller too.
 *
 *   C:  ch = **SourcePtr; (*SourcePtr)++;
 *   TS: ch = src.u8();
 */
export class RomReader {
  constructor(public pos: number) {}

  /** Returns the byte at the current position (plus `offset`) without moving. */
  public peek(offset = 0): number {
    return ROM.byteAtAddr(this.pos + offset);
  }

  /** Returns the byte at the current position and moves one byte forward. */
  public u8(): number {
    const value = ROM.byteAtAddr(this.pos);
    this.pos++;
    return value;
  }

  /** Moves forward without reading. */
  public skip(count = 1) {
    this.pos += count;
  }

  /** True when the position has reached the end of the ROM (`CommonData.EndPtr` in DMD.cpp). */
  public get atEnd(): boolean {
    return this.pos >= ROM.endPtr;
  }
}

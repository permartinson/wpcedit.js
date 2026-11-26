import { RomReader } from "./RomReader.js";

/**
 * Reads the bit stream used by image encodings 0x04/0x05 and 0x0A/0x0B.
 *
 * This replaces `ReadNextBit()` and `ReadNext8BitValue()` in DMD.cpp, and the
 * `ReadMask` and `RepeatBytes` fields of their `ImageHeader` argument. The
 * bits are read from a `RomReader`, which moves one byte forward each time
 * all 8 bits of the current byte have been read.
 */
export class BitReader {
  /** The bit to read next in the current byte, from 0x80 down to 0x01. */
  public readMask = 0x80;

  constructor(
    private readonly src: RomReader,
    private readonly repeatBytes: number[]
  ) {}

  /** True when the next bit is the first bit of a byte. */
  public get atByteStart(): boolean {
    return this.readMask == 0x80;
  }

  /** Returns the next bit: 0, or a non-zero value if the bit is set. */
  public readBit(): number {
    const bit = this.src.peek() & this.readMask;
    this.readMask >>= 1;
    if (!this.readMask) {
      this.readMask = 0x80;
      this.src.skip();
      if (this.src.atEnd) {
        return 0x00;
      }
    }
    return bit;
  }

  /**
   * Returns the next 8-bit value.
   *
   * A 0 bit is followed by 8 bits holding the value. A 1 bit (the extension
   * bit) is followed by up to 7 more 1 bits; their count selects one of the
   * 8 repeat bytes from the image header.
   */
  public readValue(): number {
    const extended = this.readBit();
    if (this.src.atEnd) {
      return 0x00;
    }

    if (extended) {
      let onesCount = 0;
      for (let i = 0; i < 7; i++) {
        // at most 7 one-bits to follow
        if (this.readBit()) {
          onesCount++;
        } else {
          i = 7;
        }
        if (this.src.atEnd) {
          return 0x00;
        }
      }
      return this.repeatBytes[onesCount];
    }

    //
    // Read the next 8 bits and return the value.
    //
    let writeMask = 0x80;
    let value = 0x00;
    for (let i = 0; i < 8; i++) {
      if (this.readBit()) {
        value |= writeMask;
      }
      if (this.src.atEnd) {
        return 0x00;
      }
      writeMask >>= 1;
    }
    return value;
  }
}

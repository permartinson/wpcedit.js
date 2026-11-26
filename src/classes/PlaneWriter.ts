import { WPC, WriteTypes } from "../resources/Constants.js";

/**
 * Writes bytes to a DMD plane and remembers the write position and how many
 * bytes have been written.
 *
 * This replaces the `unsigned char **DestPtr` and `unsigned int *WriteCounter`
 * arguments of `WriteNext8BitValue()` in DMD.cpp.
 *
 * In `WriteTypes.Rows` the bytes are written left to right, row by row. In
 * `WriteTypes.Columns` they are written top to bottom, one 8-pixel column at a
 * time, starting at the top left.
 */
export class PlaneWriter {
  /** Index in `data` where the next byte is written. */
  public pos = 0;
  /** Number of bytes written so far. */
  public count = 0;
  /** Number of bytes in a full plane. */
  public readonly capacity: number;

  constructor(
    public readonly data: Uint8Array,
    private readonly direction: number,
    private readonly cols: number = WPC.DmdCols,
    private readonly rows: number = WPC.DmdRows
  ) {
    this.capacity = Math.ceil(Math.ceil(cols / 8) * 8 * rows) / 8;
  }

  /** A writer for a new, empty full frame plane (128 x 32 pixels). */
  public static fullFrame(direction: number) {
    return new PlaneWriter(new Uint8Array(WPC.DmdPageBytes), direction);
  }

  /** True when the plane is full. */
  public get full(): boolean {
    return this.count >= this.capacity;
  }

  /** Writes one byte (8 pixels) and moves to the next position. */
  public write(value: number) {
    this.data.set([value], this.pos); // Write the actual 8-bit value
    this.count++;
    if (this.count >= this.capacity) {
      return;
    }

    if (this.direction == WriteTypes.Rows) {
      this.pos++;
      return;
    }

    if (!(this.count % this.rows)) {
      //
      // We just finished writing 32 bytes for a particular column.
      // We need to Adjust the write pointer to point up to the top
      // of the next column over.
      //
      this.pos -= (this.cols / 8) * (this.rows - 2) + (this.cols / 8 - 1);
    } else {
      //
      // We just finished writing some byte within the 32-byte column
      // NOT the last row of the column, so just advance to next row down
      // within this column.
      //
      this.pos += this.cols / 8;
    }
  }
}

import { WriteTypes } from "../../resources/Constants.js";
import { RomReader } from "../RomReader.js";
import { PlaneWriter } from "../PlaneWriter.js";

export function decode06(src: RomReader) {
  // IMAGE TYPE 0x09 or 0x06                ; ECE6h
  //
  // XOR-Repeat, Columns
  //
  // Format:
  //  0x02                   Image type byte, byte that got us this far.
  //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
  //   <data starts here>
  //
  // This encoding is identical to IMAGE TYPE 0x0A or 0x07 except the data is
  // drawn to DMD ram in COLUMNS from LEFT to RIGHT starting at the top left of
  // the DMD and ending at the bottom right.
  //
  return decode06or07(src, WriteTypes.Columns);
}

export function decode07(src: RomReader) {
  // IMAGE TYPE 0x0A or 0x07                ; ED80h
  //
  // XOR-Repeat, Rows
  //
  // Format:
  //  0x02                   Image type byte, byte that got us this far.
  //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
  //   <data starts here>
  //
  // Special XOR encoding.  This encoding scheme writes to the DMD in ROWS from
  // the TOP to BOTTOM of the DMD starting at the top-left and ending at the
  // bottom right of the display.
  //
  // Each byte is read from the data.  If a byte doesn't match the <Special Flag
  // Byte> (first byte) then the byte is simply drawn to the DMD ram.  As with all
  // encoding schemes the image for each of the 16 colums is actually drawn in
  // reverse as it appears in ram.
  //
  // If the next data byte that is read DOES match the <Special Flag Byte> then
  // the next 2 bytes are read, this makes a 3-byte pattern in the following
  // manner:
  //
  //  <Special Flag Byte>  <Repeat Count>  <XOR Value>
  //
  // When the <Special Flag Byte> is encountered, then the next 2 bytes represent
  // the <Repeat Count> and <XOR Value>.  The XOR Value is applied to the
  // EXISTING DMD ram for the number of bytes defined in <Repeat Count>.  That is,
  // the existing data in the RAM is XORed with the <XOR Value> for the number of
  // bytes in <Repeat Count>.
  //
  return decode06or07(src, WriteTypes.Rows);
}

function decode06or07(src: RomReader, direction: number) {
  const out = PlaneWriter.fullFrame(direction);
  const xorFlags = PlaneWriter.fullFrame(direction);
  const xorBits = PlaneWriter.fullFrame(direction);
  const result = () => [out.data, xorFlags.data, xorBits.data];

  const specialFlagByte = src.u8();
  if (src.atEnd) {
    return result();
  }
  do {
    const ch = src.u8();
    if (src.atEnd) {
      return result();
    }
    if (ch == specialFlagByte) {
      // NOTE: a count of 0 repeats until the plane is full, see decode01or02().
      let count = src.u8();
      if (src.atEnd) {
        return result();
      }
      const value = src.u8();
      if (src.atEnd) {
        return result();
      }
      do {
        out.write(0x00);
        xorFlags.write(0xff);
        xorBits.write(value);
      } while (--count && !out.full);
    } else {
      out.write(ch);
      xorFlags.write(0x00);
      xorBits.write(0x00);
    }
  } while (!out.full);
  return result();
}

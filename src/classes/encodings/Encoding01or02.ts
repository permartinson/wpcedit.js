import { WriteTypes } from "../../resources/Constants.js";
import { RomReader } from "../RomReader.js";
import { PlaneWriter } from "../PlaneWriter.js";

//  Simple Repeats, Columns
export function decode01(src: RomReader) {
  // IMAGE TYPE 0x04 or 0x01                ; EDF1h   Byte1 = Byte AFTER the 0x04
  //
  // Simple Repeats, Columns
  //
  // Format:
  //  0x02                   Image type byte, byte that got us this far.
  //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
  //   <data starts here>
  //
  // This is a simple encoding very similar to IMAGE TYPE 0x05 or 0x02.  This
  // encoding uses a simple single-special-byte at the top and whenever this
  // byte is encountered, the following 2 bytes are used for Repeat/Data so that
  // the Data is repeated for the number of times in 'Repeat'.
  //
  // The only difference between this and IMAGE TYPE 0x05 or 0x02 is that this
  // encoding method writes in columns from LEFT to RIGHT starting at the top
  // left and ending at the bottom right of the DMD.
  //
  return decode01or02(src, WriteTypes.Columns);
}

export function decode02(src: RomReader) {
  // IMAGE TYPE 0x05 or 0x02                ; EE70h
  //
  // Simple Repeats, Rows
  //
  // Format:
  //  0x02                   Image type byte, byte that got us this far.
  //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
  //   <data starts here>
  //
  // This is a very basic encoding that allows for repeats 8-bit patterns that
  // might occur frequently.  This writes the DMD from the TOP to the BOTTOM,
  // starting at the top left and ending at the bottom right.  As with all
  // encodings, the data actually appears in reverse at every 8-bit column on the
  // DMD, for example if the first 2 data bytes are A0B0, the top row, left side
  // of the DMD will illuminate the pixels like: .....0.0 ....00.0
  // (0 is on pixel, . is off pixel)
  //
  // The bytes are read from the data and written to the DMD memory (again, in
  // ROWS on the DMD from top to bottom).  When a byte is found that matches the
  // byte defined as <Special Flag Byte> then instead of writing the byte to the
  // DMD, the following 2 bytes are read, making up the following format:
  //
  // <Special Flag Byte> <Length> <Pattern>
  //
  // The 8-bits defined in <Pattern> are written to the DMD for the number of times
  // defined in <Length>.
  //
  // If the actual byte defined in <Special Flag Byte> needs to be drawn on the DMD
  // then a <Length> byte of 1 can be used with the <Pattern> byte matching the
  // <Special Flag Byte>.  The length should not be 0, if the length is zero, then
  // the pattern will end up being repeated 256 times.
  //
  return decode01or02(src, WriteTypes.Rows);
}

function decode01or02(src: RomReader, direction: number) {
  const out = PlaneWriter.fullFrame(direction);

  const specialFlagByte = src.u8();
  if (src.atEnd) {
    return out.data;
  }
  do {
    const ch = src.u8();
    if (src.atEnd) {
      return out.data;
    }
    if (ch == specialFlagByte) {
      // NOTE: in DMD.cpp count is an unsigned char, so a count of 0 means
      // 256 repeats. Here it repeats until the plane is full. Kept as is.
      let count = src.u8();
      if (src.atEnd) {
        return out.data;
      }
      const value = src.u8();
      if (src.atEnd) {
        return out.data;
      }
      do {
        out.write(value);
      } while (--count && !out.full);
    } else {
      out.write(ch);
    }
  } while (!out.full);
  return out.data;
}

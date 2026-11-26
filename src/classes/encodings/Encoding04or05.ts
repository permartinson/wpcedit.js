import { WriteTypes } from "../../resources/Constants.js";
import { RomReader } from "../RomReader.js";
import { PlaneWriter } from "../PlaneWriter.js";
import { BitReader } from "../BitReader.js";

export function decode04(src: RomReader) {
  //  IMAGE TYPE 0x07 or 0x04      ; Byte1 = byte AFTER bitmap type
  //
  // Complex Repeats, 9-byte header, Columns
  //
  // Format:
  //  0x04                   Image type byte, byte that got us this far.
  //   <Special Flag Byte>   Special 8-bit value that is used to signal special encodings.
  //   <Special Byte 1>      Special #1  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 2>      Special #2  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 3>      Special #3  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 4>      Special #4  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 5>      Special #5  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 6>      Special #6  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 7>      Special #7  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 8>      Special #8  Can be used for repeat counts or for actual bitmap data.
  //    <data starts here>
  //
  //   All bits drawn on the dot matrix display for this image type are drawn
  //   in COLUMNS starting at the top of the left most 8-bit column and ending
  //   at the bottom of the right-most 8-bit column.  It should be noted that the
  //   bits are also mirror-reversed for every of the 16 8-bit columns.  For
  //   example when the first byte of display memory contains a value of 0xC0 the
  //   top left corner of the dot matrix display will show ......OO where 'O' is
  //   an illuminated pixel and '.' is an off pixel.
  //
  //   Data Format:  Continuous stream of bits, starting at 0x80 bit of the first
  //                 byte and continuing until all 32x128 dots are accounted for.
  //                 This continuous stream of bits opeates in the following
  //                 manner...
  //
  //   When '0' bit is encountered, the following 8 bits are drawn on the dot
  //   matrix directly (no special encoding).  When '1' extension bit is
  //   encountered, the number of continuous 1s that follow is counted up
  //   (until a zero trailing bit is encountered and consumed).  Note that the
  //   maximum number of continuous 1s to follow the extension bit is 7, this
  //   means there is NO trailing 0 bit that is consumed after 7 continuous 1s.
  //   After 7 continuous 1s after the extension bit, the next command is
  //   processed (ie if 0 then draw next 8 bits, if 1 process another extension
  //   bit set).  The number of continuous 1s that follow the extension bit
  //   cause the following to occur...
  //
  //   # of 1s following extension bit                    Effect
  //   ----------------------------------------------------------------------------
  //                0                      Draw 8 bits defined in <Special Byte 1>, or special repeat encoding, see below,
  //                1                      Draw 8 bits defined in <Special Byte 2>, or special repeat encoding, see below,
  //                2                      Draw 8 bits defined in <Special Byte 3>, or special repeat encoding, see below,
  //                3                      Draw 8 bits defined in <Special Byte 4>, or special repeat encoding, see below,
  //                4                      Draw 8 bits defined in <Special Byte 5>, or special repeat encoding, see below,
  //                5                      Draw 8 bits defined in <Special Byte 6>, or special repeat encoding, see below,
  //                6                      Draw 8 bits defined in <Special Byte 7>, or special repeat encoding, see below,
  //                7                      Draw 8 bits defined in <Special Byte 8>, or special repeat encoding, see below,
  //
  //   <special repeat encoding>
  //   If the <Special Byte X> byte matches the 8-bit value <Special Flag Byte>
  //   (at top of graphic header) then those 8-bits defined in the special byte
  //   will NOT be drawn, instead the bit stream is read for the next TWO VALUES.
  //   The next two values that are pulled from the bit stream can be encoded by
  //   referencing the Special Byte (using extension bit followed by appropriate
  //   number of continuous 1s) or the next two values can be pulled from the bit
  //   stream using non-extended method (a 0-bit followed by 8 bits representing
  //   the value.  The next 2 values that are pulled from the bit stream can also
  //   be encoded using any combination of the previously mentioned encoded
  //   methods.  Typically the first of the 2 values is encoded using the
  //   extension-bit method and usually the 2nd of the 2 values is also encoded
  //   using the extension bit method, although it is not uncommon to see the
  //   2nd of the 2 values be a direct encoded value (0 bit followed by the
  //   desired 8-bit value.
  //
  //   The next 2 values that follow are used in the following manner:
  //     <Value1>  This is the first value read after the Special Flag Byte match occurs.
  //     <Value2>  This is the second value read after the Special Flag Byte match occurs.
  //
  //   The 8-bit value defined by <Value2> is repeated for the number of times
  //   defined by <Value1>.
  //
  //
  //struct ImageHeader
  //{
  //	unsigned char SpecialFlagByte;
  //	unsigned char RepeatBytes[8];
  //	unsigned char ReadMask;
  //};
  return decode04or05(src, WriteTypes.Columns);
}

export function decode05(src: RomReader) {
  // Complex Repeats, 9-byte header, Rows
  //
  // Format:
  //  0x04                   Image type byte, byte that got us this far.
  //   <Special Flag Byte>   Special 8-bit value that is used to signal special encodings.
  //   <Special Byte 1>      Special #1  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 2>      Special #2  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 3>      Special #3  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 4>      Special #4  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 5>      Special #5  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 6>      Special #6  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 7>      Special #7  Can be used for repeat counts or for actual bitmap data.
  //   <Special Byte 8>      Special #8  Can be used for repeat counts or for actual bitmap data.
  //    <data starts here>
  //
  // This is exactly the same as IMAGE TYPE 0x07 or 0x04 except data is written
  // on the DMD ram in ROWS from top-left to bottom-right.  This takes less code
  // space because there is no special code to decrement DMD ram to get the pointer
  // to the top of the next column.  See image type 0x07 or 0x04 below for details.
  //
  return decode04or05(src, WriteTypes.Rows);
}

function decode04or05(src: RomReader, direction: number) {
  const out = PlaneWriter.fullFrame(direction);

  const specialFlagByte = src.u8();
  if (src.atEnd) {
    return out.data;
  }
  const repeatBytes = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 8; i++) {
    repeatBytes[i] = src.u8();
    if (src.atEnd) {
      return out.data;
    }
  }
  const bits = new BitReader(src, repeatBytes);

  do {
    const ch = bits.readValue();
    if (src.atEnd) {
      return out.data;
    }
    if (ch == specialFlagByte) {
      // NOTE: a count of 0 repeats until the plane is full, see decode01or02().
      let count = bits.readValue();
      if (src.atEnd) {
        return out.data;
      }
      const value = bits.readValue();
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
  if (bits.atByteStart) {
    src.pos--;
  }
  return out.data;
}

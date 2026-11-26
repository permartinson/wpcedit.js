import { WriteTypes } from "../../resources/Constants.js";
import { RomReader } from "../RomReader.js";
import { PlaneWriter } from "../PlaneWriter.js";
import { BitReader } from "../BitReader.js";

export function decode0A(src: RomReader) {
  // IMAGE TYPE 0x0D or 0x0A                ; EBFEh
  //
  // Write Data Bytes or Multiple Skips, Columns
  //
  // Format:
  //  0x04                   Image type byte, byte that got us this far.
  //   <Special Byte 1>      Special #1  Can be used for bitmap data.
  //   <Special Byte 2>      Special #2  Can be used for bitmap data.
  //   <Special Byte 3>      Special #3  Can be used for bitmap data.
  //   <Special Byte 4>      Special #4  Can be used for bitmap data.
  //   <Special Byte 5>      Special #5  Can be used for bitmap data.
  //   <Special Byte 6>      Special #6  Can be used for bitmap data.
  //   <Special Byte 7>      Special #7  Can be used for bitmap data.
  //   <Special Byte 8>      Special #8  Can be used for bitmap data.
  //    <data starts here>
  //
  //   Data Format (following the 8-byte header)
  //   -----------------------------------------
  //   <StartWithDataRepeatFlag>
  //              |
  //              |       Start Value is zero-->
  //              +---------------------------------\
  //              |                                 |
  //              |                                 |
  //        <DataLoadCount> [LoadDtaBytes] --> <SkipCount> --> [PerformBulkSkip]
  //              |                                                    |
  //              |                                     <-- when done  |
  //              \----------------------------------------------------/
  //
  // This encoding scheme is identical to IMAGE TYPE 0x0E or 0x0B except this
  // scheme writes the data on the DMD ram in COLUMNS.
  //
  // This encoding scheme first starts with the 8-byte header.  This is used by the
  // F322 function call which will read the data as a continuous bit-stream
  // starting at the 0x80 bit of the first byte and continuously working until the
  // DMD ram has been filled.  The F322 function checks for the 1 extension bit
  // to be set and if it is then the 8-byte header is used to index a particular
  // 8-bit pattern that should be used.  If the index bit is zero, the F322
  // function simply returns the 8-bits following the 0 non-extension bit.
  //
  // The data is written to the DMD ram in rows from LEFT to RIGHT.
  //
  // The diagram above shows the sequence of events, the very first data byte
  // (after the 8-byte header) is used to determine of the cycle should begin
  // at the right side <SkipCount> or the left side <DataLoadCount>.
  //
  // While processing through the loop, the <DataLoadCount> value indicates the
  // number of 8-bit values that should be drawn to the DMD ram.  The number F322
  // function is called for the number of times defined in <DataLoadCount>.  If
  // this value is zero there is no bytes to load and the <SkipCount> is checked
  // next.
  //
  // While processing through the loop, the <SkipCount> value indicates the number
  // of 8-bit bytes that should be skipped in the DMD ram.  If this value is zero
  // then there is no skipping and the following byte is read as the
  // <DataLoadCount> value.
  //
  return decode0Aor0B(src, WriteTypes.Columns);
}

export function decode0B(src: RomReader) {
  // IMAGE TYPE 0x0E or 0x0B                ; EBC6h
  //
  // Write Data Bytes or Multiple Skips, Rows
  //
  // Format:
  //  0x04                   Image type byte, byte that got us this far.
  //   <Special Byte 1>      Special #1  Can be used for bitmap data.
  //   <Special Byte 2>      Special #2  Can be used for bitmap data.
  //   <Special Byte 3>      Special #3  Can be used for bitmap data.
  //   <Special Byte 4>      Special #4  Can be used for bitmap data.
  //   <Special Byte 5>      Special #5  Can be used for bitmap data.
  //   <Special Byte 6>      Special #6  Can be used for bitmap data.
  //   <Special Byte 7>      Special #7  Can be used for bitmap data.
  //   <Special Byte 8>      Special #8  Can be used for bitmap data.
  //    <data starts here>
  //
  //   Data Format (following the 8-byte header)
  //   -----------------------------------------
  //   <StartWithDataRepeatFlag>
  //              |
  //              |       Start Value is zero-->
  //              +---------------------------------\
  //              |                                 |
  //              |                                 |
  //        <DataLoadCount> [LoadDtaBytes] --> <SkipCount> --> [PerformBulkSkip]
  //              |                                                    |
  //              |                                     <-- when done  |
  //              \----------------------------------------------------/
  //
  // This encoding scheme is identical to IMAGE TYPE 0x0D or 0x0A except this
  // scheme writes the data on the DMD ram in ROWS.
  //
  // This encoding scheme first starts with the 8-byte header.  This is used by the
  // F322 function call which will read the data as a continuous bit-stream
  // starting at the 0x80 bit of the first byte and continuously working until the
  // DMD ram has been filled.  The F322 function checks for the 1 extension bit
  // to be set and if it is then the 8-byte header is used to index a particular
  // 8-bit pattern that should be used.  If the index bit is zero, the F322
  // function simply returns the 8-bits following the 0 non-extension bit.
  //
  // The data is written to the DMD ram in columns from TOP to BOTTOM.
  //
  // The diagram above shows the sequence of events, the very first data byte
  // (after the 8-byte header) is used to determine of the cycle should begin
  // at the right side <SkipCount> or the left side <DataLoadCount>.
  //
  // While processing through the loop, the <DataLoadCount> value indicates the
  // number of 8-bit values that should be drawn to the DMD ram.  The number F322
  // function is called for the number of times defined in <DataLoadCount>.  If
  // this value is zero there is no bytes to load and the <SkipCount> is checked
  // next.
  //
  // While processing through the loop, the <SkipCount> value indicates the number
  // of 8-bit bytes that should be skipped in the DMD ram.  If this value is zero
  // then there is no skipping and the following byte is read as the
  // <DataLoadCount> value.
  //
  return decode0Aor0B(src, WriteTypes.Rows);
}

function decode0Aor0B(src: RomReader, direction: number) {
  const out = PlaneWriter.fullFrame(direction);
  const skipped = PlaneWriter.fullFrame(direction);
  const result = () => [out.data, skipped.data];
  let continueLooping = true;

  const repeatBytes = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 8; i++) {
    repeatBytes[i] = src.u8();
    if (src.atEnd) {
      return result();
    }
  }
  const bits = new BitReader(src, repeatBytes);

  const bulkSkips = () => {
    let count = bits.readValue();
    if (src.atEnd) {
      return;
    }
    if (count) {
      do {
        out.write(0x00);
        skipped.write(0xff);
      } while (--count && !out.full);
    }
    if (out.full) {
      continueLooping = false;
    }
  };

  let count = bits.readValue();
  if (src.atEnd) {
    return result();
  }
  if (!count) {
    bulkSkips();
  }
  while (continueLooping) {
    count = bits.readValue();
    if (src.atEnd) {
      return result();
    }
    if (count) {
      do {
        out.write(bits.readValue());
        if (src.atEnd) {
          return result();
        }
        skipped.write(0x00);
      } while (--count && !out.full);
    }
    if (out.full) {
      continueLooping = false;
    }

    // NOTE: DMD.cpp stops here when the plane is full. This code reads
    // one more skip count and may write over the last byte. Kept as is.
    bulkSkips();
  }
  if (bits.atByteStart) {
    src.pos--;
  }
  return result();
}

import { WriteTypes } from "../../resources/Constants.js";
import { RomReader } from "../RomReader.js";
import { PlaneWriter } from "../PlaneWriter.js";

export function decode08(src: RomReader) {
  // IMAGE TYPE 0x0B or 0x08                ; EC91h
  //
  // Bulk Skips and Bulk Repeats, Columns
  //
  // Format:
  //  Stream of Bytes:
  //   <StartWithDataRepeatFlag>
  //              |
  //              |       Start Value is zero-->
  //              +----------------------------------------\
  //              |                                        |
  //              |                                        |
  //     <NonZeroRepeatPattern> [RepeatThePattern] --> <SkipCount> --> [PerformBulkSkip]
  //              |                                                          |
  //              |                                           <-- when done  |
  //              \----------------------------------------------------------/
  //
  // This is identical to IMAGE TYPE 0x0C or 0x09 except data is drawn to DMD ram
  // in COLUMNS left to right.
  //
  // This encoding scheme is a sequential reading of the data bytes and cycle of
  // repeated data or row-per-column skipping.  This starts out reading the
  // very first byte of the data and if it is zero, the loop starts at the right
  // side of the diagram above at <SkipCount>.  If the first byte is non-zero then
  // the loop starts at the left side of the diagram above at
  // <NonZeroRepeatPattern>.
  //
  // When processing <NonZeroRepeatPattern>, if the byte is non-zero then the
  // subsequent byte is read and repeated for the number of times defined in the
  // previously read byte <NonZeroRepeatPattern>.  After doing this pattern
  // repeat, the <SkipCount> byte is read.  The 8-bit rows-per-column are skipped
  // for the number of times defined in <SkipCount>.  After skipping 8-bit rows
  // in the column (or across multiple columns), the loop goes back to evaluate
  // <NonZeroRepeatPattern> and this cycle continues until the entire DMD ram has
  // been filled.  Note the <SkipCount> value can be zero, this will cause no
  // skipping to occur and immediate wrap around to <NonZeroRepeatPattern>.
  //
  // As with all encoding schemes, the data appears on the DMD in reverse, for
  // each column as it is stored in ram.  This is for each of the 16 columns.
  //
  //
  // *** It appears the above write-up is incorrect, the left half does NOT
  // *** repeat the pattern, rather it is the count of the number of data bytes
  // *** to read from the source and then write to DMD ram, not repeat.
  //
  return decode08or09(src, WriteTypes.Columns);
}

export function decode09(src: RomReader) {
  // IMAGE TYPE 0x0C or 0x09                ; EBFEh
  //
  // Bulk Skips and Bulk Repeats, Rows
  //
  // Format:
  //  Stream of Bytes:
  //   <StartWithDataRepeatFlag>
  //              |
  //              |       Start Value is zero-->
  //              +----------------------------------------\
  //              |                                        |
  //              |                                        |
  //     <NonZeroRepeatPattern> [RepeatThePattern] --> <SkipCount> --> [PerformBulkSkip]
  //              |                                                          |
  //              |                                           <-- when done  |
  //              \----------------------------------------------------------/
  //
  // This is identical to IMAGE TYPE 0x0B or 0x08 except data is drawn to DMD ram
  // in ROWS top to bottom.
  //
  // This encoding scheme is a sequential reading of the data bytes and cycle of
  // repeated data or 8-bit skipping.  This starts out reading the very first byte
  // of the data and if it is zero, the loop starts at the right side of the
  // diagram above at <SkipCount>.  If the first byte is non-zero then the loop
  // starts at the left side of the diagram above at <NonZeroRepeatPattern>.
  //
  // When processing <NonZeroRepeatPattern>, if the byte is non-zero then the
  // subsequent byte is read and repeated for the number of times defined in the
  // previously read byte <NonZeroRepeatPattern>.  After doing this pattern
  // repeat, the <SkipCount> byte is read.  Then 8-bits are skipped for the number
  // of times defined in <SkipCount>.  After repeatably skipping 8-bits the loop
  // goes back to evaluate <NonZeroRepeatPattern> and this cycle continues until
  // the entire DMD ram has been filled.  Note the <SkipCount> value can be zero,
  // this will cause no skipping to occur and immediate wrap around to
  // <NonZeroRepeatPattern>.
  //
  // As with all encoding schemes, the data appears on the DMD in reverse, for
  // each column as it is stored in ram.  This is for each of the 16 columns.
  //
  // *** It appears the above write-up is incorrect, the left half does NOT
  // *** repeat the pattern, rather it is the count of the number of data bytes
  // *** to read from the source and then write to DMD ram, not repeat.
  //
  return decode08or09(src, WriteTypes.Rows);
}

function decode08or09(src: RomReader, direction: number) {
  const out = PlaneWriter.fullFrame(direction);
  const skipped = PlaneWriter.fullFrame(direction);
  const result = () => [out.data, skipped.data];

  let count = src.u8();
  if (src.atEnd) {
    return result();
  }
  // DMD.cpp jumps straight to the skips ("goto RepeatSkips") when the
  // first byte is 0.
  let startWithSkips = !count;
  for (;;) {
    if (!startWithSkips) {
      count = src.u8();
      if (src.atEnd) {
        return result();
      }
      if (count) {
        do {
          const pattern = src.u8();
          if (src.atEnd) {
            return result();
          }
          out.write(pattern);
          skipped.write(0x00);
        } while (--count && !out.full);
      }
      if (out.full) {
        break;
      }
    }
    startWithSkips = false;

    // RepeatSkips:
    count = src.u8();
    if (src.atEnd) {
      return result();
    }
    if (count) {
      do {
        out.write(0x00);
        skipped.write(0xff);
      } while (--count && !out.full);
    }
    if (out.full) {
      break;
    }
  }
  return result();
}

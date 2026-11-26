import { WPC } from "../../resources/Constants.js";
import { RomReader } from "../RomReader.js";

//  Raw 32 bytes by 16 byes copy, no encodings.
export function decode00(src: RomReader) {
  // NOTE: dest has length 0, so the bytes written below are dropped and
  // the decoded image is empty. Kept as is in this refactoring step.
  const dest = new Uint8Array();
  for (let i = 0; i < WPC.DmdPageBytes; i++) {
    dest[i] = src.u8();
    if (src.atEnd) {
      return dest;
    }
  }
  return dest;
}

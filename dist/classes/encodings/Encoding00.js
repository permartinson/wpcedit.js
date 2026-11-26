import { WPC } from "../../resources/Constants.js";
export function decode00(src) {
    const dest = new Uint8Array();
    for (let i = 0; i < WPC.DmdPageBytes; i++) {
        dest[i] = src.u8();
        if (src.atEnd) {
            return dest;
        }
    }
    return dest;
}

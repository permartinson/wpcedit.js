import { WriteTypes } from "../../resources/Constants.js";
import { PlaneWriter } from "../PlaneWriter.js";
export function decode06(src) {
    return decode06or07(src, WriteTypes.Columns);
}
export function decode07(src) {
    return decode06or07(src, WriteTypes.Rows);
}
function decode06or07(src, direction) {
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
        }
        else {
            out.write(ch);
            xorFlags.write(0x00);
            xorBits.write(0x00);
        }
    } while (!out.full);
    return result();
}

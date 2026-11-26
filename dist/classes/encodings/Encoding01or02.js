import { WriteTypes } from "../../resources/Constants.js";
import { PlaneWriter } from "../PlaneWriter.js";
export function decode01(src) {
    return decode01or02(src, WriteTypes.Columns);
}
export function decode02(src) {
    return decode01or02(src, WriteTypes.Rows);
}
function decode01or02(src, direction) {
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
        }
        else {
            out.write(ch);
        }
    } while (!out.full);
    return out.data;
}

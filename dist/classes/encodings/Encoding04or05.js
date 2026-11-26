import { WriteTypes } from "../../resources/Constants.js";
import { PlaneWriter } from "../PlaneWriter.js";
import { BitReader } from "../BitReader.js";
export function decode04(src) {
    return decode04or05(src, WriteTypes.Columns);
}
export function decode05(src) {
    return decode04or05(src, WriteTypes.Rows);
}
function decode04or05(src, direction) {
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
        }
        else {
            out.write(ch);
        }
    } while (!out.full);
    if (bits.atByteStart) {
        src.pos--;
    }
    return out.data;
}

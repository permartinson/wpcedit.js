import { WriteTypes } from "../../resources/Constants.js";
import { PlaneWriter } from "../PlaneWriter.js";
export function decode08(src) {
    return decode08or09(src, WriteTypes.Columns);
}
export function decode09(src) {
    return decode08or09(src, WriteTypes.Rows);
}
function decode08or09(src, direction) {
    const out = PlaneWriter.fullFrame(direction);
    const skipped = PlaneWriter.fullFrame(direction);
    const result = () => [out.data, skipped.data];
    let count = src.u8();
    if (src.atEnd) {
        return result();
    }
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

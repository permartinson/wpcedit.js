import { WriteTypes } from "../../resources/Constants.js";
import { PlaneWriter } from "../PlaneWriter.js";
import { BitReader } from "../BitReader.js";
export function decode0A(src) {
    return decode0Aor0B(src, WriteTypes.Columns);
}
export function decode0B(src) {
    return decode0Aor0B(src, WriteTypes.Rows);
}
function decode0Aor0B(src, direction) {
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
        bulkSkips();
    }
    if (bits.atByteStart) {
        src.pos--;
    }
    return result();
}

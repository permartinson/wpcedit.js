import { ROM } from "../stores/ROM.js";
export class RomReader {
    constructor(pos) {
        this.pos = pos;
    }
    peek(offset = 0) {
        return ROM.byteAtAddr(this.pos + offset);
    }
    u8() {
        const value = ROM.byteAtAddr(this.pos);
        this.pos++;
        return value;
    }
    skip(count = 1) {
        this.pos += count;
    }
    get atEnd() {
        return this.pos >= ROM.endPtr;
    }
}

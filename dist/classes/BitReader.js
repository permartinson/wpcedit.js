export class BitReader {
    constructor(src, repeatBytes) {
        this.src = src;
        this.repeatBytes = repeatBytes;
        this.readMask = 0x80;
    }
    get atByteStart() {
        return this.readMask == 0x80;
    }
    readBit() {
        const bit = this.src.peek() & this.readMask;
        this.readMask >>= 1;
        if (!this.readMask) {
            this.readMask = 0x80;
            this.src.skip();
            if (this.src.atEnd) {
                return 0x00;
            }
        }
        return bit;
    }
    readValue() {
        const extended = this.readBit();
        if (this.src.atEnd) {
            return 0x00;
        }
        if (extended) {
            let onesCount = 0;
            for (let i = 0; i < 7; i++) {
                if (this.readBit()) {
                    onesCount++;
                }
                else {
                    i = 7;
                }
                if (this.src.atEnd) {
                    return 0x00;
                }
            }
            return this.repeatBytes[onesCount];
        }
        let writeMask = 0x80;
        let value = 0x00;
        for (let i = 0; i < 8; i++) {
            if (this.readBit()) {
                value |= writeMask;
            }
            if (this.src.atEnd) {
                return 0x00;
            }
            writeMask >>= 1;
        }
        return value;
    }
}

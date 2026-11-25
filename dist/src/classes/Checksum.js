import { toHex, logStr } from "../resources/Helpers.js";
import { ROM } from "../stores/ROM.js";
import { WPC } from "../resources/Constants.js";
export class Checksum {
    static get stored() {
        return (ROM.byteAtAddr(ROM.nonPagedBankAddr + WPC.ChecksumOffset) * 256 +
            ROM.byteAtAddr(ROM.nonPagedBankAddr + WPC.ChecksumOffset + 1));
    }
    static _getRomDelta() {
        return (ROM.byteAtAddr(ROM.nonPagedBankAddr + WPC.DeltaOffset) * 256 +
            ROM.byteAtAddr(ROM.nonPagedBankAddr + WPC.DeltaOffset + 1));
    }
    static get calculated() {
        let checksum = 0;
        for (let i = 0; i < ROM.size; i++) {
            checksum += ROM.byteAtAddr(i);
        }
        checksum %= 65536;
        return checksum;
    }
    static get delta() {
        return this._getRomDelta();
    }
    static _byteSumOf16bitVal(value) {
        value &= 0xffff;
        const highByte = (value >> 8) & 0xff;
        const lowByte = value & 0xff;
        return highByte + lowByte;
    }
    static _subtractChecksumAndDeltaBytes(checksum) {
        const romDelta = this._getRomDelta();
        const storedChecksum = this.stored;
        return (checksum -
            this._byteSumOf16bitVal(romDelta) -
            this._byteSumOf16bitVal(storedChecksum));
    }
    static disable() {
        const romDelta = this._getRomDelta();
        const romData = ROM.data;
        let status = 0;
        if (romDelta != 0x00ff) {
            romData.set([0x00, 0xff], ROM.nonPagedBankAddr + WPC.DeltaOffset);
            status = 1;
            logStr("ROM modified to disable checksum.");
        }
        return { data: romData, status: status };
    }
    static update(version, force = false) {
        version &= version;
        version = parseInt(version.toString(), 16);
        const romData = ROM.data;
        const clearedChecksum = this._subtractChecksumAndDeltaBytes(this.calculated);
        let newChecksum = 0;
        let newDelta = 0;
        let checksumFound = false;
        let status = 0;
        if (this.stored == this.calculated &&
            version == (this.stored & 0xff) &&
            !force) {
            logStr("The checksum of the ROM is correct, no need to update");
            status = 0;
        }
        else {
            logStr("Trying to figure out a new checksum and delta");
            for (let delta = this.delta; delta < 0xffff && !checksumFound; delta++) {
                if (delta == 0x00ff) {
                    delta = 0x2345;
                }
                for (let highByte = 0; highByte < 0xff && !checksumFound; highByte++) {
                    const checksum = (highByte << 8) + version;
                    if (clearedChecksum +
                        this._byteSumOf16bitVal(delta) +
                        highByte +
                        version ==
                        checksum) {
                        checksumFound = true;
                        newChecksum = checksum;
                        newDelta = delta;
                        romData.set([(newDelta >> 8) & 0xff, newDelta & 0xff], ROM.nonPagedBankAddr + WPC.DeltaOffset);
                        romData.set([(newChecksum >> 8) & 0xff, newChecksum & 0xff], ROM.nonPagedBankAddr + WPC.ChecksumOffset);
                        logStr(`New checksum is ${toHex(newChecksum)} and delta is ${toHex(newDelta)}`);
                        status = 1;
                    }
                }
            }
            if (!checksumFound) {
                logStr(`Error: Could not figure out a new checksum`);
                status = -1;
            }
        }
        return { data: romData, status: status };
    }
    static get isValid() {
        return this.calculated == this.stored;
    }
}

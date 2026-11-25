import { WPC } from "../resources/Constants.js";
import { logStr } from "../resources/Helpers.js";
export class ROM {
    constructor(data) {
        ROM.setRom(data);
    }
    static init(data) {
        if (ROM.instance) {
            return this.instance;
        }
        this.instance = new ROM(data);
        return this.instance;
    }
    static byteAtAddr(Addr) {
        if (Addr > ROM.size) {
            logStr("ERROR: Address is out of range!");
        }
        return this.currentData[Addr] & 0xFF;
    }
    static setRom(data) {
        const Length = data.length;
        let status = { error: false, msg: '' };
        if (Length != 0x40000 && Length != 0x80000 && Length != 0x100000) {
            const msg = "The file doesn't appear to be a WPC rom image.";
            logStr(msg);
            status.error = true;
            status.msg = msg;
            return status;
        }
        ROM.size = Length;
        ROM.endPtr = Length;
        ROM.currentData = data;
        ROM.totalPages = Math.floor((Length + (WPC.PageLength - 1)) / WPC.PageLength);
        ROM.startPtr = 0;
        ROM.endPtr = ROM.size - 1;
        ROM.basePageIndex = ROM.byteAtAddr(ROM.startPtr) & 0xff;
        ROM.vSImageTableMap = [[0]];
        return status;
    }
    static get data() {
        return ROM.currentData;
    }
    static set data(data) {
        ROM.setRom(data);
    }
    static get nonPagedBankAddr() {
        return ROM.size - WPC.BaseCodeAddrNonpagedRom;
    }
}
ROM.size = 0;
ROM.startPtr = 0;
ROM.endPtr = 0;
ROM.totalPages = 0;
ROM.basePageIndex = 0;
;

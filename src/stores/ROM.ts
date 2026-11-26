import { WPC } from "../resources/Constants.js";
import { logStr } from "../resources/Helpers.js";

export class ROM {
    private static instance: ROM;

    private static currentData: Uint8Array;
    public static size: number = 0;
    public static startPtr: number = 0;
    public static endPtr: number = 0;
    public static totalPages: number = 0; // includes non-banked, conceptual pages (2 pages nonbanked)
    public static basePageIndex: number = 0;
    public static vSImageTableMap: number[][]; // a map of all variable sized image tables, and images

    private constructor(data: Uint8Array) {
        ROM.setRom(data);
    }

    public static init(data: Uint8Array) {
        if(ROM.instance) {
            return this.instance;
        }
        this.instance = new ROM(data);
        return this.instance;
    }

    public static byteAtAddr(addr:number) {
        if (addr > ROM.size) {
          logStr("ERROR: Address is out of range!");
        }
        return this.currentData[addr] & 0xFF;
    }

    public static setRom(data: Uint8Array) {
        const length = data.length;
        const status = {error:false,msg:''}
        if (length != 0x40000 && length != 0x80000 && length != 0x100000) {
            const msg = "The file doesn't appear to be a WPC rom image.";
            logStr(msg);
            status.error = true;
            status.msg = msg;
            return status;
        }
        ROM.size = length;
        ROM.endPtr = length;
        ROM.currentData = data;
        ROM.totalPages = Math.floor( (length + (WPC.PageLength - 1)) / WPC.PageLength );
        ROM.startPtr = 0;
        ROM.endPtr = ROM.size - 1;
        ROM.basePageIndex = ROM.byteAtAddr(ROM.startPtr) & 0xff;
        ROM.vSImageTableMap = [[0]];
        return status;
    }

    public static get data():Uint8Array {
        return ROM.currentData;
    }

    public static set data(data: Uint8Array) {
        ROM.setRom(data);
    }

    public static get nonPagedBankAddr() {
        return ROM.size -  WPC.BaseCodeAddrNonpagedRom;
    }
};
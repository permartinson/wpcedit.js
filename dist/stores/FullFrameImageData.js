import { WPC } from "../resources/Constants.js";
export class FullFrameImageData {
    constructor() {
        const plane = new Uint8Array(WPC.DmdPageBytes);
        const dmdPlane = {
            status: 0,
            size: 0,
            data: plane,
            skipped: plane,
            xorFlags: plane,
            xorBits: plane,
            encoding: 255,
            address: 0,
            tableAddress: 0,
        };
        FullFrameImageData.planes = {
            plane0: dmdPlane,
            plane1: dmdPlane,
        };
    }
    static init() {
        if (FullFrameImageData.instance) {
            return this.instance;
        }
        this.instance = new FullFrameImageData();
        return this.instance;
    }
}
FullFrameImageData.tableAddress = 0;
FullFrameImageData.currentImageIndex = 0;

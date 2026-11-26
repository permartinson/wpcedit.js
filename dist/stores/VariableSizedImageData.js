import { WPC } from "../resources/Constants.js";
export class VariableSizedImageData {
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
        VariableSizedImageData.planes = {
            plane0: dmdPlane,
            plane1: dmdPlane,
        };
    }
    static init() {
        if (VariableSizedImageData.instance) {
            return this.instance;
        }
        this.instance = new VariableSizedImageData();
        return this.instance;
    }
}
VariableSizedImageData.tableAddress = 0;
VariableSizedImageData.address = 0;
VariableSizedImageData.currentTableIndex = 0;
VariableSizedImageData.currentImageIndex = 0;
VariableSizedImageData.currentImageXSize = 0;
VariableSizedImageData.currentImageYSize = 0;
VariableSizedImageData.currentImageXShift = 0;
VariableSizedImageData.currentImageYShift = 0;
VariableSizedImageData.minTableIndex = 0;
VariableSizedImageData.minImageIndex = 0;
VariableSizedImageData.maxTableIndex = 0;
VariableSizedImageData.maxImageIndex = 0;

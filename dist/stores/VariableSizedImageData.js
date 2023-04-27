import { WPC } from "../resources/Constants.js";
export class VariableSizedImageData {
    constructor() {
        const plane = new Uint8Array(WPC.DmdPageBytes);
        const DMDplane = {
            Plane_Status: 0,
            Plane_Size: 0,
            Plane_Data: plane,
            Plane_Skipped: plane,
            Plane_XorFlags: plane,
            Plane_XorBits: plane,
            Plane_Encoding: 255,
            Address: 0,
            Table_Address: 0
        };
        const DMDplanes = {
            Plane0: DMDplane,
            Plane1: DMDplane,
        };
        VariableSizedImageData.Planes = DMDplanes;
    }
    static init() {
        if (VariableSizedImageData.instance) {
            return this.instance;
        }
        this.instance = new VariableSizedImageData();
        return this.instance;
    }
}
VariableSizedImageData.TableAddress = 0;
VariableSizedImageData.Address = 0;
VariableSizedImageData.CurrentTableIndex = 0;
VariableSizedImageData.CurrentImageIndex = 0;
VariableSizedImageData.CurrentImageXSize = 0;
VariableSizedImageData.CurrentImageYSize = 0;
VariableSizedImageData.CurrentImageXShift = 0;
VariableSizedImageData.CurrentImageYShift = 0;
VariableSizedImageData.minTableIndex = 0;
VariableSizedImageData.minImageIndex = 0;
VariableSizedImageData.maxTableIndex = 0;
VariableSizedImageData.maxImageIndex = 0;
;

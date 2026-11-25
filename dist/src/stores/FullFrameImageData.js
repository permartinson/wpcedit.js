import { WPC } from "../resources/Constants.js";
export class FullFrameImageData {
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
        FullFrameImageData.Planes = DMDplanes;
    }
    static init() {
        if (FullFrameImageData.instance) {
            return this.instance;
        }
        this.instance = new FullFrameImageData();
        return this.instance;
    }
}
FullFrameImageData.TableAddress = 0;
FullFrameImageData.CurrentImageIndex = 0;
;

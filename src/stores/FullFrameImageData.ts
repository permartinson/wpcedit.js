import * as Defines from "../resources/Defines";
import { WPC } from "../resources/Constants.js";

export class FullFrameImageData {
    public static TableAddress = 0;
    public static CurrentImageIndex = 0;
    public static Planes: Defines.DMDPlanes;
    private static instance: FullFrameImageData;

    private constructor() {
    const plane = new Uint8Array(WPC.DmdPageBytes);
    const DMDplane: Defines.DMDPlane = {
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
    const DMDplanes: Defines.DMDPlanes = {
      Plane0: DMDplane,
      Plane1: DMDplane,
    };
    FullFrameImageData.Planes = DMDplanes;
}
    public static init() {
        if(FullFrameImageData.instance) {
            return this.instance;
        }
        this.instance = new FullFrameImageData();
        return this.instance;
    }
};
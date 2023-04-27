import * as Defines from "../resources/Defines.js";
import { WPC } from "../resources/Constants.js";

export class VariableSizedImageData {
    public static TableAddress = 0;
    public static Address = 0;

    public static CurrentTableIndex = 0;
    public static CurrentImageIndex = 0;
    public static CurrentImageXSize = 0;
    public static CurrentImageYSize = 0;

    public static CurrentImageXShift = 0;
    public static CurrentImageYShift = 0;

    public static minTableIndex = 0;
    public static minImageIndex = 0;
    public static maxTableIndex = 0;
    public static maxImageIndex = 0;

    public static Planes: Defines.DMDPlanes;

    private static instance: VariableSizedImageData;

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
    VariableSizedImageData.Planes = DMDplanes;
}
    public static init() {
        if(VariableSizedImageData.instance) {
            return this.instance;
        }
        this.instance = new VariableSizedImageData();
        return this.instance;
    }
};
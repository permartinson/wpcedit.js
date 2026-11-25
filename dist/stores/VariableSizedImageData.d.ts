import * as Defines from "../resources/Defines.js";
export declare class VariableSizedImageData {
    static TableAddress: number;
    static Address: number;
    static CurrentTableIndex: number;
    static CurrentImageIndex: number;
    static CurrentImageXSize: number;
    static CurrentImageYSize: number;
    static CurrentImageXShift: number;
    static CurrentImageYShift: number;
    static minTableIndex: number;
    static minImageIndex: number;
    static maxTableIndex: number;
    static maxImageIndex: number;
    static Planes: Defines.DMDPlanes;
    private static instance;
    private constructor();
    static init(): VariableSizedImageData;
}

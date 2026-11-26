import * as Defines from "../resources/Defines.js";
export declare class VariableSizedImageData {
    static tableAddress: number;
    static address: number;
    static currentTableIndex: number;
    static currentImageIndex: number;
    static currentImageXSize: number;
    static currentImageYSize: number;
    static currentImageXShift: number;
    static currentImageYShift: number;
    static minTableIndex: number;
    static minImageIndex: number;
    static maxTableIndex: number;
    static maxImageIndex: number;
    static planes: Defines.DmdPlanes;
    private static instance;
    private constructor();
    static init(): VariableSizedImageData;
}

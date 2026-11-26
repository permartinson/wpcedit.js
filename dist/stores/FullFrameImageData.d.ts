import * as Defines from "../resources/Defines.js";
export declare class FullFrameImageData {
    static tableAddress: number;
    static currentImageIndex: number;
    static planes: Defines.DmdPlanes;
    private static instance;
    private constructor();
    static init(): FullFrameImageData;
}

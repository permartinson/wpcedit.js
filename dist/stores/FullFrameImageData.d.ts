import * as Defines from "../resources/Defines";
export declare class FullFrameImageData {
    static TableAddress: number;
    static CurrentImageIndex: number;
    static Planes: Defines.DMDPlanes;
    private static instance;
    private constructor();
    static init(): FullFrameImageData;
}

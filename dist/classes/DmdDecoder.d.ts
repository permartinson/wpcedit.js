import * as Defines from "../resources/Defines.js";
export declare class DmdDecoder {
    static decodeNextIndex(count: number, dataType: number): void;
    private static incrementVariableSizedImageIndex;
    private static decrementVariableSizedImageIndex;
    static decodePreviousIndex(count: number, dataType: number): void;
    static decodeFullFrameGraphic(graphicIndex: number): void;
    static decodeVariableSizedImageData(): void;
    static decodeVariableSizedImageIndexToPlane(tableIndex: number, imageIndex: number): Defines.DmdPlanes;
    private static decodeVariableSizedImage;
    private static decodeVariableSizedImageToBits;
    private static decodeVariableSizedImageNoHeader;
    private static decodeVariableSizedImageHeader;
    static getImageEncoding(index: number): number;
    private static decodeImageToPlane;
    private static decodePlaneInit;
    private static decodeFullFrameGraphicImage;
}

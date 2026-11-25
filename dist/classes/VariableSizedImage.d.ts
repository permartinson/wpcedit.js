import { Plane } from "../resources/Plane.js";
export declare class VariableSizedImage {
    private static instance;
    private static currentPlane;
    static init(): VariableSizedImage;
    private constructor();
    prev(steps: number): void;
    next(steps: number): void;
    get maxImageIndex(): number;
    get minImageIndex(): number;
    get maxTableIndex(): number;
    get minTableIndex(): number;
    get indexMap(): number[][];
    set index(index: number);
    get index(): number;
    set table(table: number);
    get table(): number;
    getImageAt(table: number, index: number): Plane;
    get plane(): Plane;
    placeInFullFrame(vsPlane: Plane, xOffset: number, yOffset: number, fullFrameImage?: Uint8Array): Uint8Array;
    private static _getCurrent;
}

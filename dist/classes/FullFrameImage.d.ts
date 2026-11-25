import { Plane } from "../resources/Plane.js";
export declare class FullFrameImage {
    private static instance;
    private static currentPlane;
    static init(): FullFrameImage;
    private constructor();
    prev(steps: number): void;
    next(steps: number): void;
    get minImageIndex(): number;
    get maxImageIndex(): number;
    set index(index: number);
    get index(): number;
    get plane(): Plane;
    getPlaneAt(index: number): Plane;
    mergeImages(img1: Uint8Array, img2: Uint8Array, mask: Uint8Array): Uint8Array;
    mergePlanes(img1: Uint8Array, plane2: Plane): Uint8Array;
    private static _getCurrent;
}

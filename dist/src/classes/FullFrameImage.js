import { DataTypes, WPC } from "../resources/Constants.js";
import { DmdDecoder } from "./DmdDecoder.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
export class FullFrameImage {
    static init() {
        if (FullFrameImage.instance) {
            return this.instance;
        }
        this.instance = new FullFrameImage();
        return this.instance;
    }
    constructor() {
        FullFrameImageData.init();
    }
    prev(steps) {
        DmdDecoder.decodePreviousIndex(steps, DataTypes.Graphics);
    }
    next(steps) {
        DmdDecoder.decodeNextIndex(steps, DataTypes.Graphics);
    }
    get minImageIndex() {
        return 0;
    }
    get maxImageIndex() {
        let index = 200;
        let invalidImages = 0;
        while (invalidImages < 3 && index < 2000) {
            const plane = this.getPlaneAt(index);
            if (plane.type > 11 && plane.type != 255) {
                invalidImages++;
            }
            index++;
        }
        return index;
    }
    set index(index) {
        FullFrameImageData.CurrentImageIndex = Math.max(0, index);
    }
    get index() {
        return FullFrameImageData.CurrentImageIndex;
    }
    get plane() {
        FullFrameImage._getCurrent();
        return FullFrameImage.currentPlane;
    }
    getPlaneAt(index) {
        FullFrameImageData.CurrentImageIndex = Math.max(0, index);
        FullFrameImage._getCurrent();
        return FullFrameImage.currentPlane;
    }
    mergeImages(img1, img2, mask) {
        const imageSize = Math.min(img1.length, img2.length, mask.length);
        let mergedImage = new Uint8Array(imageSize);
        let i;
        for (i = 0; i < imageSize; i++) {
            if (mask[i] == 0xff) {
                mergedImage[i] = img1[i];
            }
            else {
                mergedImage[i] = img2[i];
            }
        }
        return mergedImage;
    }
    mergePlanes(img1, plane2) {
        const img2 = plane2.image;
        const mask = plane2.mask;
        const xor = plane2.xor;
        const flags = plane2.flags;
        const imageSize = Math.min(img1.length, img2.length);
        let mergedImage = new Uint8Array(imageSize);
        let i;
        for (i = 0; i < imageSize; i++) {
            let skip = false;
            let img1Byte = img1[i];
            let img2Byte = img2[i];
            if (flags[i] > 0) {
                for (let j = 0; j < 8; j++) {
                    const xorBit = (xor[i] >> j) & 0x01;
                    const flagBit = (flags[i] >> j) & 0x01;
                    const img1Bit = (img1Byte >> j) & 0x01;
                    if (flagBit) {
                        if (xorBit) {
                            img2Byte |= (~img1Bit & 0x01) << j;
                        }
                        else {
                            img2Byte |= img1Bit << j;
                        }
                    }
                }
            }
            if (mask[i] == 0xff) {
                mergedImage[i] = img1Byte;
            }
            else {
                mergedImage[i] = img2Byte;
            }
        }
        return mergedImage;
    }
    static _getCurrent() {
        DmdDecoder.decodeFullFrameGraphic(FullFrameImageData.CurrentImageIndex);
        FullFrameImage.currentPlane.image =
            FullFrameImageData.Planes.Plane0.Plane_Data;
        FullFrameImage.currentPlane.mask =
            FullFrameImageData.Planes.Plane0.Plane_Skipped;
        FullFrameImage.currentPlane.xor =
            FullFrameImageData.Planes.Plane0.Plane_XorBits;
        FullFrameImage.currentPlane.flags =
            FullFrameImageData.Planes.Plane0.Plane_XorFlags;
        FullFrameImage.currentPlane.type =
            FullFrameImageData.Planes.Plane0.Plane_Encoding;
        FullFrameImage.currentPlane.address =
            FullFrameImageData.Planes.Plane0.Address;
        FullFrameImage.currentPlane.tableAddress =
            FullFrameImageData.Planes.Plane0.Table_Address;
    }
}
FullFrameImage.currentPlane = {
    width: WPC.DmdCols,
    height: WPC.DmdRows,
    image: new Uint8Array(WPC.DmdPageBytes),
    mask: new Uint8Array(WPC.DmdPageBytes),
    xor: new Uint8Array(WPC.DmdPageBytes),
    flags: new Uint8Array(WPC.DmdPageBytes),
    xOffset: 0,
    yOffset: 0,
    type: 255,
    address: 0,
    tableAddress: 0,
};

import { DmdDecoder } from "./DmdDecoder.js";
import { DataTypes, WPC } from "../resources/Constants.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { ROM } from "../stores/ROM.js";
export class VariableSizedImage {
    static init() {
        if (VariableSizedImage.instance) {
            return this.instance;
        }
        this.instance = new VariableSizedImage();
        return this.instance;
    }
    constructor() {
        VariableSizedImageData.init();
    }
    prev(steps) {
        DmdDecoder.decodePreviousIndex(steps, DataTypes.FontData);
    }
    next(steps) {
        DmdDecoder.decodeNextIndex(steps, DataTypes.FontData);
    }
    get maxImageIndex() {
        return VariableSizedImageData.maxImageIndex;
    }
    get minImageIndex() {
        return VariableSizedImageData.minImageIndex;
    }
    get maxTableIndex() {
        return VariableSizedImageData.maxTableIndex;
    }
    get minTableIndex() {
        return VariableSizedImageData.minTableIndex;
    }
    get indexMap() {
        return ROM.vSImageTableMap;
    }
    set index(index) {
        VariableSizedImageData.currentImageIndex = index;
    }
    get index() {
        return VariableSizedImageData.currentImageIndex;
    }
    set table(table) {
        VariableSizedImageData.currentTableIndex = table;
    }
    get table() {
        return VariableSizedImageData.currentTableIndex;
    }
    getImageAt(table, index) {
        VariableSizedImageData.currentTableIndex = table;
        VariableSizedImageData.currentImageIndex = index;
        VariableSizedImage._getCurrent();
        return VariableSizedImage.currentPlane;
    }
    get plane() {
        VariableSizedImage._getCurrent();
        return VariableSizedImage.currentPlane;
    }
    placeInFullFrame(vsPlane, xOffset, yOffset, fullFrameImage = new Uint8Array(WPC.DmdPageBytes)) {
        const vsByteWidth = Math.ceil(vsPlane.width / 8);
        const bitOffset = ((xOffset % 8) + 8) % 8;
        const rowBytes = WPC.DmdCols / 8;
        const bytesPerRow = Math.ceil((bitOffset + vsPlane.width + 1) / 8);
        const vsImageLength = bytesPerRow * vsPlane.height;
        const startMask = 0xff >> (8 - bitOffset);
        const endBits = (bitOffset + vsPlane.width) % 8;
        const endMask = (0xff << endBits) & 0xff;
        for (let i = 0; i < vsImageLength; i++) {
            const col = i % bytesPerRow;
            const row = Math.floor(i / bytesPerRow);
            const prevByteIndex = vsByteWidth * row + (col - 1);
            const thisByteIndex = vsByteWidth * row + col;
            const destXPos = Math.floor(xOffset / 8) + col;
            const destYPos = yOffset + row;
            const destPos = destYPos * rowBytes + destXPos;
            if (destXPos < 0 || destXPos >= rowBytes || destYPos < 0 || destYPos >= WPC.DmdRows) {
                continue;
            }
            const sourceByte = fullFrameImage[destPos];
            let mergeByte = sourceByte & startMask;
            let prevByte = 0x00;
            let thisByte = 0x00;
            if (col > 0) {
                prevByte = (vsPlane.image[prevByteIndex] >> (8 - bitOffset)) & 0xff;
                mergeByte = 0x00;
            }
            if (col < bytesPerRow) {
                thisByte = (vsPlane.image[thisByteIndex] << bitOffset) & 0xff;
                thisByte = (mergeByte + thisByte) & 0xff;
            }
            let destByte = prevByte + thisByte;
            if (col == bytesPerRow - 1) {
                destByte = destByte & (0xff >> (8 - endBits));
                destByte = destByte + (sourceByte & endMask);
            }
            fullFrameImage[destPos] = destByte;
        }
        return fullFrameImage;
    }
    static _getCurrent() {
        DmdDecoder.decodeVariableSizedImageData();
        VariableSizedImage.currentPlane.image =
            VariableSizedImageData.planes.plane0.data;
        VariableSizedImage.currentPlane.mask =
            VariableSizedImageData.planes.plane0.skipped;
        VariableSizedImage.currentPlane.xor =
            VariableSizedImageData.planes.plane0.xorBits;
        VariableSizedImage.currentPlane.type =
            VariableSizedImageData.planes.plane0.encoding;
        VariableSizedImage.currentPlane.width =
            VariableSizedImageData.currentImageXSize;
        VariableSizedImage.currentPlane.height =
            VariableSizedImageData.currentImageYSize;
        VariableSizedImage.currentPlane.xOffset =
            VariableSizedImageData.currentImageXShift;
        VariableSizedImage.currentPlane.yOffset =
            VariableSizedImageData.currentImageYShift;
        VariableSizedImage.currentPlane.address = VariableSizedImageData.address;
        VariableSizedImage.currentPlane.tableAddress =
            VariableSizedImageData.tableAddress;
    }
}
VariableSizedImage.currentPlane = {
    width: 0,
    height: 0,
    image: new Uint8Array(),
    mask: new Uint8Array(),
    xor: new Uint8Array(WPC.DmdPageBytes),
    flags: new Uint8Array(WPC.DmdPageBytes),
    xOffset: 0,
    yOffset: 0,
    type: 255,
    address: 0,
    tableAddress: 0,
};

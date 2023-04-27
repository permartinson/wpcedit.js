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
        VariableSizedImageData.CurrentImageIndex = index;
    }
    get index() {
        return VariableSizedImageData.CurrentImageIndex;
    }
    set table(table) {
        VariableSizedImageData.CurrentTableIndex = table;
    }
    get table() {
        return VariableSizedImageData.CurrentTableIndex;
    }
    getImageAt(table, index) {
        VariableSizedImageData.CurrentTableIndex = table;
        VariableSizedImageData.CurrentImageIndex = index;
        VariableSizedImage._getCurrent();
        return VariableSizedImage.currentPlane;
    }
    get plane() {
        VariableSizedImage._getCurrent();
        return VariableSizedImage.currentPlane;
    }
    placeInFullFrame(vsPlane, xOffset, yOffset, fullFrameImage = new Uint8Array(WPC.DmdPageBytes)) {
        const vsByteWidth = Math.ceil(vsPlane.width / 8);
        const bitOffset = xOffset % 8;
        const bytesPerRow = Math.ceil((bitOffset + (vsPlane.width) + 1) / 8);
        const vsImageLength = bytesPerRow * vsPlane.height;
        const startMask = 0xFF >> (8 - bitOffset);
        const endMask = (0xFF << (xOffset + vsPlane.width) % 8) & 0xFF;
        for (let i = 0; i < vsImageLength; i++) {
            const col = i % bytesPerRow;
            const row = Math.floor(i / bytesPerRow);
            const prevByteIndex = vsByteWidth * row + (col - 1);
            const thisByteIndex = vsByteWidth * row + (col);
            const destXPos = Math.floor(xOffset / 8) + col;
            const destYPos = yOffset + row;
            const destPos = destYPos * (WPC.DmdCols / 8) + destXPos;
            const sourceByte = fullFrameImage[destPos];
            let mergeByte = sourceByte & startMask;
            let prevByte = 0x00;
            let thisByte = 0x00;
            if (col > 0) {
                prevByte = ((vsPlane.image[prevByteIndex]) >> 8 - bitOffset) & 0xFF;
                mergeByte = 0x00;
            }
            if (col < bytesPerRow) {
                thisByte = ((vsPlane.image[thisByteIndex]) << bitOffset) & 0xFF;
                thisByte = (mergeByte + thisByte & 0xFF);
            }
            let destByte = prevByte + thisByte;
            if (col == bytesPerRow - 1) {
                destByte = destByte & (0xFF >> (8 - (xOffset + vsPlane.width) % 8));
                destByte = destByte + (sourceByte & endMask);
            }
            fullFrameImage[destPos] = destByte;
        }
        return fullFrameImage;
    }
    static _getCurrent() {
        DmdDecoder.decodeVariableSizedImageIndexToPlane(VariableSizedImageData.CurrentTableIndex, VariableSizedImageData.CurrentImageIndex);
        DmdDecoder.decodeVariableSizedImageData();
        VariableSizedImage.currentPlane.image = VariableSizedImageData.Planes.Plane0.Plane_Data;
        VariableSizedImage.currentPlane.mask = VariableSizedImageData.Planes.Plane0.Plane_Skipped;
        VariableSizedImage.currentPlane.xor = VariableSizedImageData.Planes.Plane0.Plane_XorBits;
        VariableSizedImage.currentPlane.type = VariableSizedImageData.Planes.Plane0.Plane_Encoding;
        VariableSizedImage.currentPlane.width = VariableSizedImageData.CurrentImageXSize;
        VariableSizedImage.currentPlane.height = VariableSizedImageData.CurrentImageYSize;
        VariableSizedImage.currentPlane.xOffset = VariableSizedImageData.CurrentImageXShift;
        VariableSizedImage.currentPlane.yOffset = VariableSizedImageData.CurrentImageYShift;
        VariableSizedImage.currentPlane.address = VariableSizedImageData.Address;
        VariableSizedImage.currentPlane.tableAddress = VariableSizedImageData.TableAddress;
    }
}
VariableSizedImage.currentPlane = {
    width: 0,
    height: 0,
    image: new Uint8Array,
    mask: new Uint8Array,
    xor: new Uint8Array(WPC.DmdPageBytes),
    flags: new Uint8Array(WPC.DmdPageBytes),
    xOffset: 0,
    yOffset: 0,
    type: 255,
    address: 0,
    tableAddress: 0
};

import { WriteTypes, ImageCodes, DataTypes, PlaneStatuses, WPC, } from "../resources/Constants.js";
import { DataParser } from "./DataParser.js";
import { toHex, logStr } from "../resources/Helpers.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
import { ROM } from "../stores/ROM.js";
import { RomReader } from "./RomReader.js";
import { PlaneWriter } from "./PlaneWriter.js";
import { decode00 } from "./encodings/Encoding00.js";
import { decode01, decode02 } from "./encodings/Encoding01or02.js";
import { decode03 } from "./encodings/Encoding03.js";
import { decode04, decode05 } from "./encodings/Encoding04or05.js";
import { decode06, decode07 } from "./encodings/Encoding06or07.js";
import { decode08, decode09 } from "./encodings/Encoding08or09.js";
import { decode0A, decode0B } from "./encodings/Encoding0Aor0B.js";
export class DmdDecoder {
    static decodeNextIndex(count, dataType) {
        var _a, _b;
        switch (dataType) {
            case DataTypes.Graphics:
                while (count--) {
                    {
                        FullFrameImageData.currentImageIndex++;
                    }
                }
                break;
            case DataTypes.FontData:
            case DataTypes.AniData:
                if (VariableSizedImageData.planes.plane0.status ==
                    PlaneStatuses.Valid) {
                    if (VariableSizedImageData.currentImageXShift + WPC.DmdCols <
                        VariableSizedImageData.currentImageXSize) {
                        VariableSizedImageData.currentImageXShift +=
                            WPC.ImageShiftXPixelCount * count;
                        break;
                    }
                    if (VariableSizedImageData.currentImageYShift + WPC.DmdRows <
                        VariableSizedImageData.currentImageYSize) {
                        VariableSizedImageData.currentImageYShift +=
                            WPC.ImageShiftYPixelCount * count;
                        break;
                    }
                }
                VariableSizedImageData.currentImageXShift = -1;
                VariableSizedImageData.currentImageYShift = -1;
                while (count--) {
                    const next = DmdDecoder.incrementVariableSizedImageIndex({
                        tableIndex: VariableSizedImageData.currentTableIndex,
                        imageIndex: VariableSizedImageData.currentImageIndex,
                    });
                    VariableSizedImageData.currentTableIndex = (_a = next === null || next === void 0 ? void 0 : next.tableIndex) !== null && _a !== void 0 ? _a : -1;
                    VariableSizedImageData.currentImageIndex = (_b = next === null || next === void 0 ? void 0 : next.imageIndex) !== null && _b !== void 0 ? _b : -1;
                    if (next === null) {
                        logStr(`Unexpected error advancing image indexes`);
                    }
                }
                break;
            default:
                break;
        }
    }
    static incrementVariableSizedImageIndex(position) {
        let { tableIndex, imageIndex } = position;
        if (tableIndex == null || imageIndex == null) {
            return null;
        }
        const lastImageIndex = DataParser.getLastImageIndex(imageIndex, tableIndex).last;
        if (lastImageIndex == -1) {
            return null;
        }
        if ((imageIndex & 0xff) < (lastImageIndex & 0xff)) {
            imageIndex = DataParser.getNextImageIndex(imageIndex, tableIndex);
            if (imageIndex == -1) {
                return null;
            }
            return { tableIndex, imageIndex };
        }
        if (tableIndex < VariableSizedImageData.maxTableIndex) {
            tableIndex++;
            imageIndex = DataParser.getFirstImageIndex(tableIndex);
            if (imageIndex == -1) {
                return null;
            }
            return { tableIndex, imageIndex };
        }
        return { tableIndex: 0, imageIndex: 0 };
    }
    static decrementVariableSizedImageIndex(position) {
        let { tableIndex, imageIndex } = position;
        if (tableIndex == null || imageIndex == null) {
            return null;
        }
        const firstImageIndex = DataParser.getFirstImageIndex(tableIndex);
        if (firstImageIndex == -1) {
            return null;
        }
        if ((imageIndex & 0xff) > (firstImageIndex & 0xff)) {
            imageIndex = DataParser.getPrevImageIndex(imageIndex, tableIndex);
            if (imageIndex == -1) {
                return null;
            }
            return { tableIndex, imageIndex };
        }
        if (tableIndex > VariableSizedImageData.minTableIndex) {
            tableIndex = tableIndex - 1;
            if (DataParser.getLastImageIndex(imageIndex, tableIndex).last != 0) {
                return null;
            }
            return { tableIndex, imageIndex };
        }
        return { tableIndex, imageIndex };
    }
    static decodePreviousIndex(count, dataType) {
        var _a, _b;
        switch (dataType) {
            case DataTypes.Graphics:
                while (count-- && FullFrameImageData.currentImageIndex) {
                    FullFrameImageData.currentImageIndex--;
                }
                break;
            case DataTypes.FontData:
            case DataTypes.AniData:
                if (VariableSizedImageData.planes.plane0.status ==
                    PlaneStatuses.Valid) {
                    if (VariableSizedImageData.currentImageYShift > 0) {
                        VariableSizedImageData.currentImageYShift -=
                            WPC.ImageShiftYPixelCount * count;
                        if (VariableSizedImageData.currentImageYShift < 0) {
                            VariableSizedImageData.currentImageYShift = 0;
                        }
                        break;
                    }
                    if (VariableSizedImageData.currentImageXShift > 0) {
                        VariableSizedImageData.currentImageXShift -=
                            WPC.ImageShiftXPixelCount * count;
                        if (VariableSizedImageData.currentImageXShift < 0) {
                            VariableSizedImageData.currentImageXShift = 0;
                        }
                        break;
                    }
                }
                VariableSizedImageData.currentImageXShift = -1;
                VariableSizedImageData.currentImageYShift = -1;
                while (count--) {
                    const prev = DmdDecoder.decrementVariableSizedImageIndex({
                        tableIndex: VariableSizedImageData.currentTableIndex,
                        imageIndex: VariableSizedImageData.currentImageIndex,
                    });
                    VariableSizedImageData.currentTableIndex = (_a = prev === null || prev === void 0 ? void 0 : prev.tableIndex) !== null && _a !== void 0 ? _a : -1;
                    VariableSizedImageData.currentImageIndex = (_b = prev === null || prev === void 0 ? void 0 : prev.imageIndex) !== null && _b !== void 0 ? _b : -1;
                }
                break;
            default:
                break;
        }
    }
    static decodeFullFrameGraphic(graphicIndex) {
        FullFrameImageData.planes.plane0 = this.decodeImageToPlane(graphicIndex);
        FullFrameImageData.planes.plane1 = this.decodeImageToPlane(graphicIndex + 1);
    }
    static decodeVariableSizedImageData() {
        VariableSizedImageData.planes =
            DmdDecoder.decodeVariableSizedImageIndexToPlane(VariableSizedImageData.currentTableIndex, VariableSizedImageData.currentImageIndex);
        if (VariableSizedImageData.planes.plane0.status != PlaneStatuses.Valid) {
            VariableSizedImageData.currentImageXSize = 0;
            VariableSizedImageData.currentImageYSize = 0;
            VariableSizedImageData.currentImageXShift = 0;
            VariableSizedImageData.currentImageYShift = 0;
        }
    }
    static decodeVariableSizedImageIndexToPlane(tableIndex, imageIndex) {
        const planes = {
            plane0: DmdDecoder.decodePlaneInit(),
            plane1: DmdDecoder.decodePlaneInit(),
        };
        VariableSizedImageData.currentImageXSize = 0;
        VariableSizedImageData.currentImageYSize = 0;
        const addr = DataParser.getROMAddressOfVariableSizedImageIndex(tableIndex, imageIndex);
        VariableSizedImageData.address = addr !== null && addr !== void 0 ? addr : -1;
        if (addr === null) {
            planes.plane0.status = PlaneStatuses.BadDimension;
            planes.plane1.status = PlaneStatuses.BadDimension;
            return planes;
        }
        return DmdDecoder.decodeVariableSizedImage(addr, planes, tableIndex);
    }
    static decodeVariableSizedImage(source, planes, tableIndex) {
        VariableSizedImageData.address = source;
        const src = new RomReader(source);
        const ch = src.peek();
        const metadata = DataParser.getVariableSizedImageTableMetadata(tableIndex);
        if (metadata === null) {
            logStr(`Unexpected problem looking up TableIndex ${tableIndex} height & spacing`);
            return planes;
        }
        if (ch > 0 && ch <= WPC.DmdCols) {
            planes = DmdDecoder.decodeVariableSizedImageNoHeader(src, planes, metadata.height);
        }
        else {
            switch (ch) {
                case ImageCodes.Monochrome:
                case ImageCodes.BicolorIndirect:
                case ImageCodes.BicolorDirect:
                case ImageCodes.FD:
                    break;
                default:
                    logStr(`Unrecognized Header Byte ${ch}`);
                    break;
            }
            planes = DmdDecoder.decodeVariableSizedImageHeader(src, planes, tableIndex);
        }
        return planes;
    }
    static decodeVariableSizedImageToBits(src, imageHeight, imageWidth) {
        const out = new PlaneWriter(new Uint8Array(Math.ceil(Math.ceil(imageWidth / 8) * 8 * imageHeight) / 8), WriteTypes.Rows, imageWidth, imageHeight);
        if (src.atEnd) {
            return [PlaneStatuses.ImageOutOfRange, out.data];
        }
        if (VariableSizedImageData.currentImageYShift == -1) {
            VariableSizedImageData.currentImageYShift = 0;
            while (WPC.DmdRows + VariableSizedImageData.currentImageYShift <
                imageHeight) {
                VariableSizedImageData.currentImageYShift += WPC.ImageShiftYPixelCount;
            }
        }
        if (VariableSizedImageData.currentImageXShift == -1) {
            VariableSizedImageData.currentImageXShift = 0;
            while (WPC.DmdCols + VariableSizedImageData.currentImageXShift <
                imageWidth) {
                VariableSizedImageData.currentImageXShift += WPC.ImageShiftXPixelCount;
            }
        }
        for (let i = 0; i < VariableSizedImageData.currentImageYShift; i++) {
            for (let j = 0; j < (imageWidth + 7) / 8; j++) {
                if (src.atEnd) {
                    return [PlaneStatuses.ImageOutOfRange, out.data];
                }
                src.skip();
            }
        }
        for (let i = 0; i < imageHeight && !out.full; i++) {
            for (let j = 0; j < Math.floor((imageWidth + 7) / 8); j++) {
                if (src.atEnd) {
                    return [PlaneStatuses.ImageOutOfRange, out.data];
                }
                const ch = src.u8();
                if (j >=
                    Math.floor((VariableSizedImageData.currentImageXShift + 7) / 8) &&
                    j <
                        Math.floor(imageWidth + VariableSizedImageData.currentImageXShift + 7) /
                            8) {
                    out.write(ch);
                }
            }
        }
        for (let i = 0; i <
            imageHeight - (WPC.DmdRows + VariableSizedImageData.currentImageYShift); i++) {
            for (let j = 0; j < (imageWidth + 7) / 8; j++) {
                if (src.atEnd) {
                    return [PlaneStatuses.ImageOutOfRange, out.data];
                }
                src.skip();
            }
        }
        VariableSizedImageData.currentImageXSize = imageWidth;
        VariableSizedImageData.currentImageYSize = imageHeight;
        return [PlaneStatuses.Valid, out.data];
    }
    static decodeVariableSizedImageNoHeader(src, planes, tableHeight) {
        planes.plane0.status = PlaneStatuses.Invalid;
        planes.plane1.status = PlaneStatuses.Invalid;
        planes.plane0.size = 0;
        planes.plane1.size = 0;
        if (src.atEnd) {
            logStr(`Address is out of bounds in decodeVariableSizedImageNoHeader()`);
            return planes;
        }
        const imageWidth = src.u8();
        const result = this.decodeVariableSizedImageToBits(src, tableHeight, imageWidth);
        planes.plane0.status = result[0];
        planes.plane0.data = result[1];
        return planes;
    }
    static decodeVariableSizedImageHeader(src, planes, tableIndex) {
        planes.plane0.status = PlaneStatuses.Invalid;
        planes.plane1.status = PlaneStatuses.Invalid;
        planes.plane0.size = 0;
        planes.plane0.size = 0;
        planes.plane0.address = src.pos;
        planes.plane1.address = src.pos;
        const headerByte = src.u8();
        if (src.atEnd) {
            return planes;
        }
        src.u8();
        if (src.atEnd) {
            return planes;
        }
        src.u8();
        if (src.atEnd) {
            return planes;
        }
        const imageHeight = src.u8();
        if (src.atEnd) {
            return planes;
        }
        const imageWidth = src.u8();
        if (src.atEnd) {
            return planes;
        }
        switch (headerByte) {
            case ImageCodes.BicolorDirect: {
                const result1 = this.decodeVariableSizedImageToBits(new RomReader(src.pos), imageHeight, imageWidth);
                planes.plane1.status = result1[0];
                planes.plane1.data = result1[1];
                const result0 = this.decodeVariableSizedImageToBits(new RomReader(src.pos), imageHeight, imageWidth);
                planes.plane0.status = result0[0];
                planes.plane0.data = result0[1];
                break;
            }
            case ImageCodes.BicolorIndirect: {
                const pointer = DataParser.extractWPCAddrAndPageOfImageTable(tableIndex);
                if (pointer === null) {
                    logStr(`decodeVariableSizedImageHeader(), Unexpected problem looking up TableIndex ${tableIndex} WPC Page`);
                    return planes;
                }
                const tmpBuf = [0, 0, 0];
                tmpBuf[0] = src.u8() & 0xff;
                if (src.atEnd) {
                    return planes;
                }
                tmpBuf[1] = src.u8() & 0xff;
                if (src.atEnd) {
                    return planes;
                }
                tmpBuf[2] = pointer.page & 0xff;
                const addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(tmpBuf[0]);
                if (addr === null) {
                    logStr(`decodeVariableSizedImageHeader(), Unexpected problem looking up ROM address of bi-color plane from 3-byte WPC Addr ${tmpBuf[0] & 0xff} ${tmpBuf[1] & 0xff} ${tmpBuf[2] & 0xff}`);
                    return planes;
                }
                const biColor = ROM.byteAtAddr(addr);
                const result1 = this.decodeVariableSizedImageToBits(new RomReader(biColor), imageHeight, imageWidth);
                planes.plane1.status = result1[0];
                planes.plane1.data = result1[1];
                const result0 = this.decodeVariableSizedImageToBits(src, imageHeight, imageWidth);
                planes.plane0.status = result0[0];
                planes.plane0.data = result0[1];
                break;
            }
            case ImageCodes.FD:
            default: {
                const result = this.decodeVariableSizedImageToBits(src, imageHeight, imageWidth);
                planes.plane0.status = result[0];
                planes.plane0.data = result[1];
                break;
            }
        }
        return planes;
    }
    static getImageEncoding(index) {
        const plane = this.decodeImageToPlane(index);
        return plane.encoding;
    }
    static decodeImageToPlane(index, skipDecoding = false) {
        const plane = DmdDecoder.decodePlaneInit();
        plane.tableAddress = FullFrameImageData.tableAddress;
        const addr = FullFrameImageData.tableAddress + index * 3;
        if (addr >= ROM.size) {
            plane.status = PlaneStatuses.TableEntryOutOfRange;
            return plane;
        }
        const romAddr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(addr);
        if (romAddr === null) {
            logStr(`decodeImageToPlane() got error from GetROMAddressFromAddrOf3ByteWPCAddrPage()`);
            plane.status = PlaneStatuses.TableEntryOutOfRange;
            return plane;
        }
        if (romAddr >= ROM.size) {
            plane.status = PlaneStatuses.TableEntryOutOfRange;
            return plane;
        }
        const src = new RomReader(romAddr);
        this.decodeFullFrameGraphicImage(src, plane, skipDecoding);
        plane.size = src.pos - romAddr;
        return plane;
    }
    static decodePlaneInit() {
        const plane = {
            size: 0,
            data: new Uint8Array(WPC.DmdPageBytes),
            skipped: new Uint8Array(WPC.DmdPageBytes),
            xorFlags: new Uint8Array(WPC.DmdPageBytes),
            xorBits: new Uint8Array(WPC.DmdPageBytes),
            status: PlaneStatuses.Valid,
            encoding: 255,
            address: 0,
            tableAddress: 0,
        };
        return plane;
    }
    static decodeFullFrameGraphicImage(src, plane, skipDecoding) {
        const ch = src.peek();
        plane.encoding = ch & 0x0f;
        plane.address = src.pos;
        if (skipDecoding) {
            return;
        }
        src.skip();
        if (src.atEnd) {
            plane.status = PlaneStatuses.ImageOutOfRange;
            return;
        }
        logStr(`Type ${toHex(ch)}`);
        switch (ch & 0x0f) {
            case 0x00:
                plane.data = decode00(src);
                return;
            case 0x01:
                plane.data = decode01(src);
                return;
            case 0x02:
                plane.data = decode02(src);
                return;
            case 0x03:
                decode03(src);
                plane.status = PlaneStatuses.Unimplemented;
                return;
            case 0x04:
                plane.data = decode04(src);
                return;
            case 0x05:
                plane.data = decode05(src);
                return;
            case 0x06: {
                const [data, xorFlags, xorBits] = decode06(src);
                plane.data = data;
                plane.xorFlags = xorFlags;
                plane.xorBits = xorBits;
                return;
            }
            case 0x07: {
                const [data, xorFlags, xorBits] = decode07(src);
                plane.data = data;
                plane.xorFlags = xorFlags;
                plane.xorBits = xorBits;
                return;
            }
            case 0x08: {
                const [data, skipped] = decode08(src);
                plane.data = data;
                plane.skipped = skipped;
                return;
            }
            case 0x09: {
                const [data, skipped] = decode09(src);
                plane.data = data;
                plane.skipped = skipped;
                return;
            }
            case 0x0a: {
                const [data, skipped] = decode0A(src);
                plane.data = data;
                plane.skipped = skipped;
                return;
            }
            case 0x0b: {
                const [data, skipped] = decode0B(src);
                plane.data = data;
                plane.skipped = skipped;
                return;
            }
            default:
                logStr(`Unknown Image Type ${ch}`);
                plane.status = PlaneStatuses.Unknown;
                return;
        }
    }
}

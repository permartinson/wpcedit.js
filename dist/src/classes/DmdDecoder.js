import { WriteTypes, ImageCodes, DataTypes, PlaneStatuses, WPC, } from "../resources/Constants.js";
import { DataParser } from "./DataParser.js";
import { toHex, logStr } from "../resources/Helpers.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
import { ROM } from "../stores/ROM.js";
export class DmdDecoder {
    constructor() {
        this.PreviousPlaneDataPane0 = new Uint8Array();
        this.PreviousPlaneDataPane1 = new Uint8Array();
    }
    init() { }
    static decodeNextIndex(count, dataType) {
        switch (dataType) {
            case DataTypes.Graphics:
                while (count--) {
                    {
                        FullFrameImageData.CurrentImageIndex++;
                    }
                }
                break;
            case DataTypes.FontData:
            case DataTypes.AniData:
                if (VariableSizedImageData.Planes.Plane0.Plane_Status ==
                    PlaneStatuses.Valid) {
                    if (VariableSizedImageData.CurrentImageXShift + WPC.DmdCols <
                        VariableSizedImageData.CurrentImageXSize) {
                        VariableSizedImageData.CurrentImageXShift +=
                            WPC.ImageShiftXPixelCount * count;
                        break;
                    }
                    if (VariableSizedImageData.CurrentImageYShift + WPC.DmdRows <
                        VariableSizedImageData.CurrentImageYSize) {
                        VariableSizedImageData.CurrentImageYShift +=
                            WPC.ImageShiftYPixelCount * count;
                        break;
                    }
                }
                VariableSizedImageData.CurrentImageXShift = -1;
                VariableSizedImageData.CurrentImageYShift = -1;
                while (count--) {
                    const result = DmdDecoder.incrementVariableSizedImageIndex(VariableSizedImageData.CurrentTableIndex, VariableSizedImageData.CurrentImageIndex);
                    VariableSizedImageData.CurrentTableIndex = result[0];
                    VariableSizedImageData.CurrentImageIndex = result[1];
                    if (result[0] == -1) {
                        logStr(`Unexpected error advancing image indexes`);
                    }
                }
                break;
            default:
                break;
        }
    }
    static incrementVariableSizedImageIndex(pTableIndex, pImageIndex) {
        let tmpImageIndex;
        if (pTableIndex == null || pImageIndex == null) {
            return [-1, -1];
        }
        tmpImageIndex = DataParser.getLastImageIndex(pImageIndex, pTableIndex)[0];
        if (tmpImageIndex == -1) {
            return [-1, -1];
        }
        if ((pImageIndex & 0xff) < (tmpImageIndex & 0xff)) {
            pImageIndex = DataParser.getNextImageIndex(pImageIndex, pTableIndex);
            if (pImageIndex == -1) {
                return [-1, -1];
            }
            return [pTableIndex, pImageIndex];
        }
        if (pTableIndex < VariableSizedImageData.maxTableIndex) {
            pTableIndex++;
            pImageIndex = DataParser.getFirstImageIndex(pTableIndex);
            if (pImageIndex == -1) {
                return [-1, -1];
            }
            return [pTableIndex, pImageIndex];
        }
        return [0, 0];
    }
    static decrementVariableSizedImageIndex(pTableIndex, pImageIndex) {
        let tmpImageIndex;
        if (pTableIndex == null || pImageIndex == null) {
            return [-1, -1];
        }
        tmpImageIndex = DataParser.getFirstImageIndex(pTableIndex);
        if (tmpImageIndex == -1) {
            return [-1, -1];
        }
        if ((pImageIndex & 0xff) > (tmpImageIndex & 0xff)) {
            pImageIndex = DataParser.getPrevImageIndex(pImageIndex, pTableIndex);
            if (pImageIndex == -1) {
                return [-1, -1];
            }
            return [pTableIndex, pImageIndex];
        }
        if (pTableIndex > VariableSizedImageData.minTableIndex) {
            pTableIndex = pTableIndex - 1;
            if (DataParser.getLastImageIndex(pImageIndex, pTableIndex)[0] != 0) {
                return [-1, -1];
            }
            return [pTableIndex, pImageIndex];
        }
        return [pTableIndex, pImageIndex];
    }
    static decodePreviousIndex(count, dataType) {
        switch (dataType) {
            case DataTypes.Graphics:
                while (count-- && FullFrameImageData.CurrentImageIndex) {
                    FullFrameImageData.CurrentImageIndex--;
                }
                break;
            case DataTypes.FontData:
            case DataTypes.AniData:
                if (VariableSizedImageData.Planes.Plane0.Plane_Status ==
                    PlaneStatuses.Valid) {
                    if (VariableSizedImageData.CurrentImageYShift > 0) {
                        VariableSizedImageData.CurrentImageYShift -=
                            WPC.ImageShiftYPixelCount * count;
                        if (VariableSizedImageData.CurrentImageYShift < 0) {
                            VariableSizedImageData.CurrentImageYShift = 0;
                        }
                        break;
                    }
                    if (VariableSizedImageData.CurrentImageXShift > 0) {
                        VariableSizedImageData.CurrentImageXShift -=
                            WPC.ImageShiftXPixelCount * count;
                        if (VariableSizedImageData.CurrentImageXShift < 0) {
                            VariableSizedImageData.CurrentImageXShift = 0;
                        }
                        break;
                    }
                }
                VariableSizedImageData.CurrentImageXShift = -1;
                VariableSizedImageData.CurrentImageYShift = -1;
                while (count--) {
                    const result = DmdDecoder.decrementVariableSizedImageIndex(VariableSizedImageData.CurrentTableIndex, VariableSizedImageData.CurrentImageIndex);
                    VariableSizedImageData.CurrentTableIndex = result[0];
                    VariableSizedImageData.CurrentImageIndex = result[1];
                    if (result[0] == -1) {
                    }
                }
                break;
            default:
                break;
        }
    }
    static decodeFullFrameGraphic(GraphicIndex) {
        FullFrameImageData.Planes.Plane0 = this.decodeImageToPlane(GraphicIndex);
        FullFrameImageData.Planes.Plane1 = this.decodeImageToPlane(GraphicIndex + 1);
    }
    static decodeVariableSizedImageData() {
        const result = DmdDecoder.decodeVariableSizedImageIndexToPlane(VariableSizedImageData.CurrentTableIndex, VariableSizedImageData.CurrentImageIndex);
        VariableSizedImageData.Planes = result[1];
        if (VariableSizedImageData.Planes.Plane0.Plane_Status != PlaneStatuses.Valid) {
            VariableSizedImageData.CurrentImageXSize = 0;
            VariableSizedImageData.CurrentImageYSize = 0;
            VariableSizedImageData.CurrentImageXShift = 0;
            VariableSizedImageData.CurrentImageYShift = 0;
        }
    }
    static decodeVariableSizedImageIndexToPlane(TableIndex, ImageIndex) {
        let DataPtr;
        let Addr;
        let pPlanes = {
            Plane0: DmdDecoder.decodePlaneInit(),
            Plane1: DmdDecoder.decodePlaneInit(),
        };
        VariableSizedImageData.CurrentImageXSize = 0;
        VariableSizedImageData.CurrentImageYSize = 0;
        Addr = DataParser.getROMAddressOfVariableSizedImageIndex(TableIndex, ImageIndex);
        VariableSizedImageData.Address = Addr;
        if (Addr == -1) {
            pPlanes.Plane0.Plane_Status = PlaneStatuses.BadDimension;
            pPlanes.Plane1.Plane_Status = PlaneStatuses.BadDimension;
            return [-1, pPlanes];
        }
        DataPtr = Addr;
        pPlanes = DmdDecoder.decodeVariableSizedImage(DataPtr, pPlanes, TableIndex)[1];
        return [0, pPlanes];
    }
    static decodeVariableSizedImage(Source, pPlanes, TableIndex) {
        let TableHeight;
        let TableSpacing;
        VariableSizedImageData.Address = Source;
        let ch = ROM.byteAtAddr(Source);
        const result = DataParser.getVariableSizedImageTableMetadata(TableIndex);
        TableHeight = result[0];
        TableSpacing = result[1];
        if (TableHeight == -1) {
            logStr(`Unexpected problem looking up TableIndex ${TableIndex} height & spacing`);
            return [-1, pPlanes];
        }
        if (ch > 0 && ch <= WPC.DmdCols) {
            pPlanes = DmdDecoder.decodeVariableSizedImageIndex_NoHeader(Source, pPlanes, TableHeight);
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
            pPlanes = DmdDecoder.decodeVariableSizedImageIndex_Header(Source, pPlanes, TableHeight, TableIndex);
        }
        return [0, pPlanes];
    }
    static decodeVariableSizedImageToBits(SourcePtr, Dest, ImageHeight, ImageWidth, Centered = false) {
        let ch;
        let WriteCounter = 0;
        let i, j;
        let DestPtr = 0;
        Dest = new Uint8Array(Math.ceil(Math.ceil(ImageWidth / 8) * 8 * ImageHeight) / 8);
        if (SourcePtr >= ROM.endPtr) {
            return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
        }
        if (VariableSizedImageData.CurrentImageYShift == -1) {
            VariableSizedImageData.CurrentImageYShift = 0;
            while (WPC.DmdRows + VariableSizedImageData.CurrentImageYShift <
                ImageHeight) {
                VariableSizedImageData.CurrentImageYShift += WPC.ImageShiftYPixelCount;
            }
        }
        if (VariableSizedImageData.CurrentImageXShift == -1) {
            VariableSizedImageData.CurrentImageXShift = 0;
            while (WPC.DmdCols + VariableSizedImageData.CurrentImageXShift <
                ImageWidth) {
                VariableSizedImageData.CurrentImageXShift += WPC.ImageShiftXPixelCount;
            }
        }
        for (i = 0; i < VariableSizedImageData.CurrentImageYShift; i++) {
            for (j = 0; j < (ImageWidth + 7) / 8; j++) {
                if (SourcePtr++ >= ROM.endPtr) {
                    return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
                }
            }
        }
        for (i = 0; i < ImageHeight && WriteCounter < Dest.length; i++) {
            for (j = 0; j < Math.floor((ImageWidth + 7) / 8); j++) {
                ch = ROM.byteAtAddr(SourcePtr);
                if (SourcePtr++ >= ROM.endPtr) {
                    return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
                }
                if (j >=
                    Math.floor((VariableSizedImageData.CurrentImageXShift + 7) / 8) &&
                    j <
                        Math.floor(ImageWidth + VariableSizedImageData.CurrentImageXShift + 7) /
                            8) {
                    const result = this.writeNext8BitValueAnySize(WriteCounter, Dest, DestPtr, ch, WriteTypes.Rows, ImageWidth, ImageHeight);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                }
            }
        }
        for (i = 0; i <
            ImageHeight - (WPC.DmdRows + VariableSizedImageData.CurrentImageYShift); i++) {
            for (j = 0; j < (ImageWidth + 7) / 8; j++) {
                if (SourcePtr++ >= ROM.endPtr) {
                    return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
                }
            }
        }
        VariableSizedImageData.CurrentImageXSize = ImageWidth;
        VariableSizedImageData.CurrentImageYSize = ImageHeight;
        return [PlaneStatuses.Valid, Dest, SourcePtr];
    }
    static decodeVariableSizedImageIndex_NoHeader(SourcePtr, pPlanes, TableHeight) {
        let DestPlane0 = pPlanes.Plane0.Plane_Data;
        let DestPlane1 = pPlanes.Plane1.Plane_Data;
        let ImageWidth;
        pPlanes.Plane0.Plane_Status = PlaneStatuses.Invalid;
        pPlanes.Plane1.Plane_Status = PlaneStatuses.Invalid;
        pPlanes.Plane0.Plane_Size = 0;
        pPlanes.Plane1.Plane_Size = 0;
        ImageWidth = ROM.byteAtAddr(SourcePtr);
        if (SourcePtr++ >= ROM.endPtr) {
            logStr(`Address is out of bounds in decodeVariableSizedImageIndex_NoHeader()`);
            return pPlanes;
        }
        const result = this.decodeVariableSizedImageToBits(SourcePtr, DestPlane0, TableHeight, ImageWidth);
        pPlanes.Plane0.Plane_Status = result[0];
        pPlanes.Plane0.Plane_Data = result[1];
        SourcePtr = result[2];
        return pPlanes;
    }
    static decodeVariableSizedImageIndex_Header(SourcePtr, pPlanes, TableHeight, TableIndex) {
        let DestPlane0 = pPlanes.Plane0.Plane_Data;
        let DestPlane1 = pPlanes.Plane1.Plane_Data;
        let HeaderByte;
        let VerticalOffset;
        let HorizontalOffset;
        let ImageHeight;
        let ImageWidth;
        pPlanes.Plane0.Plane_Status = PlaneStatuses.Invalid;
        pPlanes.Plane1.Plane_Status = PlaneStatuses.Invalid;
        pPlanes.Plane0.Plane_Size = 0;
        pPlanes.Plane0.Plane_Size = 0;
        pPlanes.Plane0.Address = SourcePtr;
        pPlanes.Plane1.Address = SourcePtr;
        HeaderByte = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return pPlanes;
        }
        VerticalOffset = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return pPlanes;
        }
        HorizontalOffset = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return pPlanes;
        }
        ImageHeight = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return pPlanes;
        }
        ImageWidth = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return pPlanes;
        }
        switch (HeaderByte) {
            case ImageCodes.BicolorDirect:
                const result1 = this.decodeVariableSizedImageToBits(SourcePtr, DestPlane1, ImageHeight, ImageWidth);
                pPlanes.Plane1.Plane_Status = result1[0];
                pPlanes.Plane1.Plane_Data = result1[1];
                const result0 = this.decodeVariableSizedImageToBits(SourcePtr, DestPlane0, ImageHeight, ImageWidth);
                pPlanes.Plane0.Plane_Status = result0[0];
                pPlanes.Plane0.Plane_Data = result0[1];
                break;
            case ImageCodes.BicolorIndirect:
                {
                    let Page;
                    let TmpBuf = [0, 0, 0];
                    let Addr;
                    let pBiColor;
                    const result = DataParser.extractWPCAddrAndPageOfImageTable(TableIndex);
                    Addr = result[0];
                    Page = result[1];
                    if (Addr == -1) {
                        logStr(`decodeVariableSizedImageIndex_Header(), Unexpected problem looking up TableIndex ${TableIndex} WPC Page`);
                        return pPlanes;
                    }
                    TmpBuf[0] = ROM.byteAtAddr(SourcePtr) & 0xff;
                    SourcePtr++;
                    if (SourcePtr >= ROM.endPtr) {
                        return pPlanes;
                    }
                    TmpBuf[1] = ROM.byteAtAddr(SourcePtr) & 0xff;
                    SourcePtr++;
                    if (SourcePtr >= ROM.endPtr) {
                        return pPlanes;
                    }
                    TmpBuf[2] = Page & 0xff;
                    Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(TmpBuf[0]);
                    if (Addr == -1) {
                        logStr(`decodeVariableSizedImageIndex_Header(), Unexpected problem looking up ROM address of bi-color plane from 3-byte WPC Addr ${TmpBuf[0] & 0xff} ${TmpBuf[1] & 0xff} ${TmpBuf[2] & 0xff}`);
                        return pPlanes;
                    }
                    pBiColor = ROM.byteAtAddr(Addr);
                    const result1 = this.decodeVariableSizedImageToBits(pBiColor, DestPlane1, ImageHeight, ImageWidth);
                    pPlanes.Plane1.Plane_Status = result1[0];
                    pPlanes.Plane1.Plane_Data = result1[1];
                    const result0 = this.decodeVariableSizedImageToBits(SourcePtr, DestPlane0, ImageHeight, ImageWidth);
                    pPlanes.Plane0.Plane_Status = result0[0];
                    pPlanes.Plane0.Plane_Data = result0[1];
                }
                break;
            case ImageCodes.FD:
            default:
                const result = this.decodeVariableSizedImageToBits(SourcePtr, DestPlane0, ImageHeight, ImageWidth);
                pPlanes.Plane0.Plane_Status = result[0];
                pPlanes.Plane0.Plane_Data = result[1];
                break;
        }
        return pPlanes;
    }
    static getImageEncoding(Index) {
        const pPlane = this.decodeImageToPlane(Index);
        return pPlane.Plane_Encoding;
    }
    static decodeImageToPlane(Index, SkipDecoding = false) {
        let pPlane;
        let OriginalDataPtr;
        let DataPtr;
        let Addr;
        let DMDPlane;
        DMDPlane = DmdDecoder.decodePlaneInit();
        DMDPlane.Table_Address = FullFrameImageData.TableAddress;
        Addr = FullFrameImageData.TableAddress + Index * 3;
        if (Addr >= ROM.size) {
            DMDPlane.Plane_Status = PlaneStatuses.TableEntryOutOfRange;
            return DMDPlane;
        }
        Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(Addr);
        if (Addr == -1) {
            logStr(`decodeImageToPlane() got error from GetROMAddressFromAddrOf3ByteWPCAddrPage()`);
            DMDPlane.Plane_Status = PlaneStatuses.TableEntryOutOfRange;
            return DMDPlane;
        }
        if (Addr >= ROM.size) {
            DMDPlane.Plane_Status = PlaneStatuses.TableEntryOutOfRange;
            return DMDPlane;
        }
        OriginalDataPtr = DataPtr = Addr;
        DMDPlane = this.decodeFullFrameGraphicImage(Addr, DMDPlane, SkipDecoding);
        DMDPlane.Plane_Size = DataPtr - OriginalDataPtr;
        return DMDPlane;
    }
    static decodePlaneInit() {
        let Plane = new Uint8Array(WPC.DmdPageBytes);
        let pPlane = {
            Plane_Size: 0,
            Plane_Data: Plane,
            Plane_Skipped: Plane,
            Plane_XorFlags: Plane,
            Plane_XorBits: Plane,
            Plane_Status: PlaneStatuses.Valid,
            Plane_Encoding: 255,
            Address: 0,
            Table_Address: 0,
        };
        return pPlane;
    }
    static decodeFullFrameGraphicImage(Source, pPlane, SkipDecoding) {
        let OriginalDataPtr = Source;
        let Dest = new Uint8Array(pPlane.Plane_Data);
        let ch = ROM.byteAtAddr(Source);
        pPlane.Plane_Encoding = ch & 0x0f;
        pPlane.Address = Source;
        if (SkipDecoding) {
            return pPlane;
        }
        Source++;
        if (Source >= ROM.endPtr) {
            pPlane.Plane_Status = PlaneStatuses.ImageOutOfRange;
            return pPlane;
        }
        logStr(`Type ${toHex(ch)}`);
        switch (ch & 0x0f) {
            case 0x00:
                Dest = this.decode_00(Source);
                pPlane.Plane_Data = Dest;
                return pPlane;
            case 0x01:
                Dest = this.decode_01(Source);
                pPlane.Plane_Data = Dest;
                return pPlane;
            case 0x02:
                Dest = this.decode_02(Source);
                pPlane.Plane_Data = Dest;
                return pPlane;
            case 0x03:
                Dest = this.decode_03(Source);
                pPlane.Plane_Status = PlaneStatuses.Unimplemented;
                return pPlane;
            case 0x04:
                Dest = this.decode_04(Source);
                pPlane.Plane_Data = Dest;
                return pPlane;
            case 0x05:
                Dest = this.decode_05(Source);
                pPlane.Plane_Data = Dest;
                return pPlane;
            case 0x06:
                const result_06 = this.decode_06(Source);
                pPlane.Plane_Data = result_06[0];
                pPlane.Plane_XorFlags = result_06[1];
                pPlane.Plane_XorBits = result_06[2];
                return pPlane;
            case 0x07:
                const result_07 = this.decode_07(Source);
                pPlane.Plane_Data = result_07[0];
                pPlane.Plane_XorFlags = result_07[1];
                pPlane.Plane_XorBits = result_07[2];
                return pPlane;
            case 0x08:
                const result_08 = this.decode_08(Source);
                pPlane.Plane_Data = result_08[0];
                pPlane.Plane_Skipped = result_08[1];
                return pPlane;
                break;
            case 0x09:
                const result_09 = this.decode_09(Source);
                pPlane.Plane_Data = result_09[0];
                pPlane.Plane_Skipped = result_09[1];
                return pPlane;
            case 0x0a:
                const result_0A = this.decode_0A(Source);
                pPlane.Plane_Data = result_0A[0];
                pPlane.Plane_Skipped = result_0A[1];
                return pPlane;
            case 0x0b:
                const result_0B = this.decode_0B(Source);
                pPlane.Plane_Data = result_0B[0];
                pPlane.Plane_Skipped = result_0B[1];
                return pPlane;
            default:
                logStr(`Unknown Image Type ${ch}`);
                pPlane.Plane_Data = Dest;
                pPlane.Plane_Status = PlaneStatuses.Unknown;
                pPlane.Plane_Size = OriginalDataPtr - Source;
                return pPlane;
        }
        if (Source >= ROM.endPtr) {
            pPlane.Plane_Status = PlaneStatuses.ImageOutOfRange;
            return pPlane;
        }
        pPlane.Plane_Status = PlaneStatuses.Valid;
        return pPlane;
    }
    static decode_00(Source) {
        let Dest = new Uint8Array();
        let i;
        for (i = 0; i < WPC.DmdPageBytes; i++) {
            Dest[i] = ROM.byteAtAddr(Source + i);
            if (Source + i >= ROM.endPtr) {
                return Dest;
            }
        }
        return Dest;
    }
    static decode_01(Source) {
        return this.decode_01or02(Source, WriteTypes.Columns);
    }
    static decode_02(Source) {
        return this.decode_01or02(Source, WriteTypes.Rows);
    }
    static decode_01or02(SourcePtr, Type) {
        let DestPtr = 0;
        let Dest = new Uint8Array(WPC.DmdPageBytes);
        let ch;
        let SpecialFlagByte;
        let WriteCounter;
        SpecialFlagByte = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return Dest;
        }
        WriteCounter = 0;
        DestPtr = 0;
        do {
            ch = ROM.byteAtAddr(SourcePtr);
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                return Dest;
            }
            if (ch == SpecialFlagByte) {
                let Value1 = ROM.byteAtAddr(SourcePtr);
                SourcePtr++;
                if (SourcePtr >= ROM.endPtr) {
                    return Dest;
                }
                let Value2 = ROM.byteAtAddr(SourcePtr);
                SourcePtr++;
                if (SourcePtr >= ROM.endPtr) {
                    return Dest;
                }
                do {
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, Value2, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                } while (--Value1 && WriteCounter < WPC.DmdPageBytes);
            }
            else {
                const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, ch, Type);
                DestPtr = result[0];
                Dest = result[1];
                WriteCounter = result[2];
            }
        } while (WriteCounter < WPC.DmdPageBytes);
        return Dest;
    }
    static decode_03(Source) {
        return new Uint8Array();
    }
    static decode_04(Source) {
        return this.decode_04or05(Source, WriteTypes.Columns);
    }
    static decode_05(Source) {
        return this.decode_04or05(Source, WriteTypes.Rows);
    }
    static decode_04or05(SourcePtr, Type) {
        let Dest = new Uint8Array(WPC.DmdPageBytes);
        let DestPtr = 0;
        let Header = {
            ReadMask: 0x80,
            RepeatBytes: [0, 0, 0, 0, 0, 0, 0, 0],
            SpecialFlagByte: ROM.byteAtAddr(SourcePtr),
        };
        let ch;
        let i;
        let WriteCounter;
        WriteCounter = 0;
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return Dest;
        }
        for (i = 0; i < 8; i++) {
            Header.RepeatBytes[i] = ROM.byteAtAddr(SourcePtr);
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                return Dest;
            }
        }
        do {
            const result = DmdDecoder.readNext8BitValue(Header, SourcePtr);
            Header = result[0];
            ch = result[1];
            SourcePtr = result[2];
            if (SourcePtr >= ROM.endPtr) {
                return Dest;
            }
            if (ch == Header.SpecialFlagByte) {
                const result1 = DmdDecoder.readNext8BitValue(Header, SourcePtr);
                Header = result1[0];
                let Value1 = result1[1];
                SourcePtr = result1[2];
                if (SourcePtr >= ROM.endPtr) {
                    return Dest;
                }
                const result2 = DmdDecoder.readNext8BitValue(Header, SourcePtr);
                Header = result2[0];
                let Value2 = result2[1];
                SourcePtr = result2[2];
                if (SourcePtr >= ROM.endPtr) {
                    return Dest;
                }
                do {
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, Value2, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                } while (--Value1 && WriteCounter < WPC.DmdPageBytes);
            }
            else {
                const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, ch, Type);
                DestPtr = result[0];
                Dest = result[1];
                WriteCounter = result[2];
            }
        } while (WriteCounter < WPC.DmdPageBytes);
        if (Header.ReadMask == 0x80) {
            SourcePtr--;
        }
        return Dest;
    }
    static decode_06(Source) {
        return this.decode_06or07(Source, WriteTypes.Columns);
    }
    static decode_07(Source) {
        return this.decode_06or07(Source, WriteTypes.Rows);
    }
    static decode_06or07(SourcePtr, Type) {
        let Dest = new Uint8Array(WPC.DmdPageBytes);
        let XorFlags = new Uint8Array(WPC.DmdPageBytes);
        let XorBits = new Uint8Array(WPC.DmdPageBytes);
        let DestPtr = 0;
        let XorFlagsPtr = 0;
        let XorBitsPtr = 0;
        let ch;
        let SpecialFlagByte;
        let WriteCounter;
        let XorFlagsCounter;
        let XorBitsCounter;
        SpecialFlagByte = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return [Dest, XorFlags, XorBits];
        }
        WriteCounter = XorFlagsCounter = XorBitsCounter = 0;
        do {
            ch = ROM.byteAtAddr(SourcePtr);
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                return [Dest, XorFlags, XorBits];
            }
            if (ch == SpecialFlagByte) {
                let Value1 = ROM.byteAtAddr(SourcePtr);
                SourcePtr++;
                if (SourcePtr >= ROM.endPtr) {
                    return [Dest, XorFlags, XorBits];
                }
                let Value2 = ROM.byteAtAddr(SourcePtr);
                SourcePtr++;
                if (SourcePtr >= ROM.endPtr) {
                    return [Dest, XorFlags, XorBits];
                }
                do {
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, 0x00, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                    const resultXorFlags = DmdDecoder.writeNext8BitValue(XorFlagsCounter, XorFlags, XorFlagsPtr, 0xff, Type);
                    XorFlagsPtr = resultXorFlags[0];
                    XorFlags = resultXorFlags[1];
                    XorFlagsCounter = resultXorFlags[2];
                    const resultXorBits = DmdDecoder.writeNext8BitValue(XorBitsCounter, XorBits, XorBitsPtr, Value2, Type);
                    XorBitsPtr = resultXorBits[0];
                    XorBits = resultXorBits[1];
                    XorBitsCounter = resultXorBits[2];
                } while (--Value1 && WriteCounter < WPC.DmdPageBytes);
            }
            else {
                const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, ch, Type);
                DestPtr = result[0];
                Dest = result[1];
                WriteCounter = result[2];
                const resultXorFlags = DmdDecoder.writeNext8BitValue(XorFlagsCounter, XorFlags, XorFlagsPtr, 0x00, Type);
                XorFlagsPtr = resultXorFlags[0];
                XorFlags = resultXorFlags[1];
                XorFlagsCounter = resultXorFlags[2];
                const resultXorBits = DmdDecoder.writeNext8BitValue(XorBitsCounter, XorBits, XorBitsPtr, 0x00, Type);
                XorBitsPtr = resultXorBits[0];
                XorBits = resultXorBits[1];
                XorBitsCounter = resultXorBits[2];
            }
        } while (WriteCounter < WPC.DmdPageBytes);
        return [Dest, XorFlags, XorBits];
    }
    static decode_08(Source) {
        return this.decode_08or09(Source, WriteTypes.Columns);
    }
    static decode_09(Source) {
        return this.decode_08or09(Source, WriteTypes.Rows);
    }
    static decode_08or09(SourcePtr, Type) {
        let DestPtr = 0;
        let Dest = new Uint8Array(WPC.DmdPageBytes);
        let SkippedPtr = 0;
        let Skipped = new Uint8Array(WPC.DmdPageBytes);
        let count;
        let pattern;
        let WriteCounter;
        let SkippedCounter;
        let continueLooping = true;
        function repeatSkips() {
            count = ROM.byteAtAddr(SourcePtr);
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                return [Dest, Skipped];
            }
            if (count) {
                do {
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, 0x00, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                    const resultSkipped = DmdDecoder.writeNext8BitValue(SkippedCounter, Skipped, SkippedPtr, 0xff, Type);
                    SkippedPtr = resultSkipped[0];
                    Skipped = resultSkipped[1];
                    SkippedCounter = resultSkipped[2];
                } while (--count && WriteCounter < WPC.DmdPageBytes);
            }
            if (WriteCounter >= WPC.DmdPageBytes) {
                continueLooping = false;
            }
        }
        count = SourcePtr;
        count = ROM.byteAtAddr(SourcePtr);
        SourcePtr++;
        if (SourcePtr >= ROM.endPtr) {
            return [Dest, Skipped];
        }
        WriteCounter = SkippedCounter = 0;
        if (!count) {
            repeatSkips();
        }
        while (continueLooping) {
            count = ROM.byteAtAddr(SourcePtr);
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                return [Dest, Skipped];
            }
            if (count) {
                do {
                    pattern = ROM.byteAtAddr(SourcePtr);
                    SourcePtr++;
                    if (SourcePtr >= ROM.endPtr) {
                        return [Dest, Skipped];
                    }
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, pattern, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                    const resultSkipped = DmdDecoder.writeNext8BitValue(SkippedCounter, Skipped, SkippedPtr, 0x00, Type);
                    SkippedPtr = resultSkipped[0];
                    Skipped = resultSkipped[1];
                    SkippedCounter = resultSkipped[2];
                } while (--count && WriteCounter < WPC.DmdPageBytes);
            }
            if (WriteCounter >= WPC.DmdPageBytes) {
                continueLooping = false;
            }
            if (continueLooping) {
                repeatSkips();
            }
        }
        return [Dest, Skipped];
    }
    static decode_0A(Source) {
        return DmdDecoder.decode_0Aor0B(Source, WriteTypes.Columns);
    }
    static decode_0B(Source) {
        return this.decode_0Aor0B(Source, WriteTypes.Rows);
    }
    static decode_0Aor0B(SourcePtr, Type) {
        let DestPtr = 0;
        let Dest = new Uint8Array(WPC.DmdPageBytes);
        let SkippedPtr = 0;
        let Skipped = new Uint8Array(WPC.DmdPageBytes);
        let Header = {
            ReadMask: 0x80,
            RepeatBytes: [0, 0, 0, 0, 0, 0, 0, 0],
            SpecialFlagByte: 0,
        };
        let count;
        let i;
        let WriteCounter;
        let SkippedCounter;
        let continueLooping = true;
        Header.ReadMask = 0x80;
        WriteCounter = SkippedCounter = 0;
        function BulkSkips() {
            const result = DmdDecoder.readNext8BitValue(Header, SourcePtr);
            Header = result[0];
            count = result[1];
            SourcePtr = result[2];
            if (SourcePtr >= ROM.endPtr) {
                return [Dest, Skipped];
            }
            if (count) {
                do {
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, 0x00, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                    const resultSkipped = DmdDecoder.writeNext8BitValue(SkippedCounter, Skipped, SkippedPtr, 0xff, Type);
                    SkippedPtr = resultSkipped[0];
                    Skipped = resultSkipped[1];
                    SkippedCounter = resultSkipped[2];
                } while (--count && WriteCounter < WPC.DmdPageBytes);
            }
            if (WriteCounter >= WPC.DmdPageBytes) {
                continueLooping = false;
                return [Dest, Skipped];
            }
            return [Dest, Skipped];
        }
        for (i = 0; i < 8; i++) {
            Header.RepeatBytes[i] = ROM.byteAtAddr(SourcePtr);
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                return [Dest, Skipped];
            }
        }
        const result = DmdDecoder.readNext8BitValue(Header, SourcePtr);
        Header = result[0];
        count = result[1];
        SourcePtr = result[2];
        if (SourcePtr >= ROM.endPtr) {
            return [Dest, Skipped];
        }
        if (!count) {
            BulkSkips();
        }
        while (continueLooping) {
            const result = DmdDecoder.readNext8BitValue(Header, SourcePtr);
            Header = result[0];
            count = result[1];
            SourcePtr = result[2];
            if (SourcePtr >= ROM.endPtr) {
                return [Dest, Skipped];
            }
            if (count) {
                do {
                    const resultRead = DmdDecoder.readNext8BitValue(Header, SourcePtr);
                    Header = resultRead[0];
                    const Read = resultRead[1];
                    SourcePtr = resultRead[2];
                    const result = DmdDecoder.writeNext8BitValue(WriteCounter, Dest, DestPtr, Read, Type);
                    DestPtr = result[0];
                    Dest = result[1];
                    WriteCounter = result[2];
                    if (SourcePtr >= ROM.endPtr) {
                        return [Dest, Skipped];
                    }
                    const resultSkipped = DmdDecoder.writeNext8BitValue(SkippedCounter, Skipped, SkippedPtr, 0x00, Type);
                    SkippedPtr = resultSkipped[0];
                    Skipped = resultSkipped[1];
                    SkippedCounter = resultSkipped[2];
                } while (--count && WriteCounter < WPC.DmdPageBytes);
            }
            if (WriteCounter >= WPC.DmdPageBytes) {
                continueLooping = false;
            }
            BulkSkips();
        }
        if (Header.ReadMask == 0x80) {
            SourcePtr--;
        }
        return [Dest, Skipped];
    }
    static writeNext8BitValue(WriteCounterPtr, Dest, DestPtr, ch, Type) {
        return DmdDecoder.writeNext8BitValueAnySize(WriteCounterPtr, Dest, DestPtr, ch, Type, WPC.DmdCols, WPC.DmdRows);
    }
    static writeNext8BitValueAnySize(WriteCounterPtr, Dest, DestPtr, ch, Type, cols, rows) {
        Dest.set([ch], DestPtr);
        WriteCounterPtr++;
        if (WriteCounterPtr >= Math.ceil(Math.ceil(cols / 8) * 8 * rows) / 8) {
            return [DestPtr, Dest, WriteCounterPtr];
        }
        if (Type == WriteTypes.Rows) {
            DestPtr++;
            return [DestPtr, Dest, WriteCounterPtr];
        }
        if (!(WriteCounterPtr % rows)) {
            DestPtr -= (cols / 8) * (rows - 2) + (cols / 8 - 1);
        }
        else {
            DestPtr += cols / 8;
        }
        return [DestPtr, Dest, WriteCounterPtr];
    }
    static readNext8BitValue(Header, SourcePtr) {
        let returnValues;
        const result = DmdDecoder.readNextBit(Header, SourcePtr);
        let ch = result[0];
        Header = result[1];
        SourcePtr = result[2];
        if (SourcePtr >= ROM.endPtr) {
            returnValues = [Header, 0x00, SourcePtr];
            return returnValues;
        }
        let WriteMask;
        let ReturnValue;
        let i;
        if (ch) {
            let OnesCount = 0;
            for (i = 0; i < 7; i++) {
                const result = DmdDecoder.readNextBit(Header, SourcePtr);
                Header = result[1];
                SourcePtr = result[2];
                if (result[0]) {
                    OnesCount++;
                }
                else {
                    i = 7;
                }
                if (SourcePtr >= ROM.endPtr) {
                    returnValues = [Header, 0x00, SourcePtr];
                    return returnValues;
                }
            }
            ReturnValue = Header.RepeatBytes[OnesCount];
        }
        else {
            WriteMask = 0x80;
            ReturnValue = 0x00;
            for (i = 0; i < 8; i++) {
                const result = DmdDecoder.readNextBit(Header, SourcePtr);
                Header = result[1];
                SourcePtr = result[2];
                if (result[0]) {
                    ReturnValue |= WriteMask;
                }
                if (SourcePtr >= ROM.endPtr) {
                    returnValues = [Header, 0x00, SourcePtr];
                    return returnValues;
                }
                WriteMask >>= 1;
            }
        }
        returnValues = [Header, ReturnValue, SourcePtr];
        return returnValues;
    }
    static readNextBit(Header, SourcePtr) {
        let returnValues;
        let ch = ROM.byteAtAddr(SourcePtr) & Header.ReadMask;
        if (!(Header.ReadMask >>= 1)) {
            Header.ReadMask = 0x80;
            SourcePtr++;
            if (SourcePtr >= ROM.endPtr) {
                returnValues = [0x00, Header, SourcePtr];
                return returnValues;
            }
        }
        returnValues = [ch, Header, SourcePtr];
        return returnValues;
    }
}

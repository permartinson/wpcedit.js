import { HitTypes, DataTypes, WPC } from "../resources/Constants.js";
import { toHex, logStr } from "../resources/Helpers.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
import { ROM } from "../stores/ROM.js";
export class DataParser {
    constructor() { }
    static init(romData) {
        if (DataParser.instance) {
            return this.instance;
        }
        this.instance = new DataParser();
        return this.instance;
    }
    static initTableAddrs(dataType) {
        let Page;
        let PageByteIdx;
        let HitTablePtr;
        let HitPagePtr;
        let RomAddr;
        let WpcAddr;
        let Ptr = 0;
        logStr(`Searching ROM for Master Animation Table Address`);
        for (Page = 0; Page < ROM.totalPages; Page++) {
            for (PageByteIdx = 0; PageByteIdx < WPC.PageLength; PageByteIdx++) {
                switch (ROM.byteAtAddr(Ptr++) & 0xff) {
                    case 0xbe:
                        if (PageByteIdx >= WPC.PageLength - 16) {
                            break;
                        }
                        if ((ROM.byteAtAddr(Ptr + 2) & 0xff) == 0x3a &&
                            (ROM.byteAtAddr(Ptr + 3) & 0xff) == 0x58 &&
                            (ROM.byteAtAddr(Ptr + 4) & 0xff) == 0x3a &&
                            (ROM.byteAtAddr(Ptr + 5) & 0xff) == 0xd6 &&
                            (ROM.byteAtAddr(Ptr + 7) & 0xff) == 0x34 &&
                            (ROM.byteAtAddr(Ptr + 8) & 0xff) == 0x04 &&
                            ((ROM.byteAtAddr(Ptr + 9) & 0xff) == 0xf6 ||
                                (ROM.byteAtAddr(Ptr + 9) & 0xff) == 0xbd) &&
                            ((ROM.byteAtAddr(Ptr + 12) & 0xff) == 0xbd ||
                                (ROM.byteAtAddr(Ptr + 12) & 0xff) == 0xf6)) {
                            HitTablePtr = Ptr;
                            HitPagePtr = Ptr + 2;
                            RomAddr =
                                DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitTablePtr);
                            if (RomAddr == -1) {
                                logStr(`Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Font Table Pointer opcode: ${toHex(HitTablePtr & 0xff)} ${toHex((HitTablePtr + 1) & 0xff)}`);
                                return -1;
                            }
                            logStr(`Address in ROM of Font Table Pointer ${toHex(RomAddr)}`);
                            if (dataType == DataTypes.FontData) {
                                VariableSizedImageData.TableAddress = DataParser.processHitType(HitTypes.AddrAddr, HitTablePtr, HitPagePtr, Ptr);
                                if (VariableSizedImageData.TableAddress == -1) {
                                    logStr(`Error from ProcessHitType while trying to process Font Table Pointer opcode: ${toHex(HitTablePtr & 0xff)} ${toHex((HitTablePtr + 1) & 0xff)}`);
                                    break;
                                }
                                logStr(`Found Address in ROM of Font Table ${toHex(VariableSizedImageData.TableAddress)}`);
                            }
                            HitTablePtr = RomAddr;
                            HitPagePtr = RomAddr + 2;
                            WpcAddr =
                                ((ROM.byteAtAddr(HitTablePtr & 0xff) << 8) +
                                    (ROM.byteAtAddr(HitTablePtr + 1)) & 0xff) &
                                    0xffff;
                            if (WpcAddr >= WPC.BaseCodeAddrNonpagedRom &&
                                WpcAddr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength &&
                                ROM.byteAtAddr(HitPagePtr & 0xff) != WPC.NonpagedBankIndicator) {
                                RomAddr += 2;
                            }
                            else {
                                RomAddr += 3;
                            }
                            logStr(`Address in ROM of Graphics Table Pointer ${toHex(RomAddr)}`);
                            HitTablePtr = RomAddr;
                            HitPagePtr = RomAddr + 2;
                            FullFrameImageData.TableAddress = this.processHitType(HitTypes.Addr, HitTablePtr, HitPagePtr, Ptr);
                            if (FullFrameImageData.TableAddress == -1) {
                                logStr(`Error from processHitType while trying to process Graphic Table Pointer: ${toHex(HitTablePtr & 0xff)} ${toHex((HitTablePtr + 1) & 0xff)}`);
                                if (dataType == DataTypes.FontData) {
                                    return 0;
                                }
                                return -1;
                            }
                            logStr(`Found Address in ROM of Graphics Table ${toHex(FullFrameImageData.TableAddress)}`);
                            if (dataType != DataTypes.AniData) {
                                return 0;
                            }
                            HitTablePtr = ROM.byteAtAddr(RomAddr);
                            HitPagePtr = ROM.byteAtAddr(RomAddr + 2);
                            WpcAddr =
                                ((ROM.byteAtAddr(HitTablePtr & 0xff) << 8) +
                                    (ROM.byteAtAddr(HitTablePtr + 1) & 0xff)) &
                                    0xffff;
                            if (WpcAddr >= WPC.BaseCodeAddrNonpagedRom &&
                                WpcAddr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength &&
                                ROM.byteAtAddr(HitPagePtr & 0xff) != WPC.NonpagedBankIndicator) {
                                RomAddr += 2;
                            }
                            else {
                                RomAddr += 3;
                            }
                            logStr(`Address in ROM of Animation Table Pointer ${toHex(RomAddr)}`);
                            HitTablePtr = ROM.byteAtAddr(RomAddr);
                            HitPagePtr = ROM.byteAtAddr(RomAddr + 2);
                            VariableSizedImageData.TableAddress = this.processHitType(HitTypes.Addr, HitTablePtr, HitPagePtr, Ptr);
                            if (VariableSizedImageData.TableAddress == -1) {
                                logStr(`Error from processHitType while trying to process Animation Table Pointer: ${HitTablePtr & 0xff} ${(HitTablePtr + 1) & 0xff}`);
                                return -1;
                            }
                            logStr(`Found Address in ROM of Animation Table ${toHex(VariableSizedImageData.TableAddress)}`);
                            ROM.startPtr = Ptr;
                            return 0;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
    static getFirstImageIndex(TableIndex) {
        const imageIndex = this.getNextImageIndex(0, TableIndex);
        if (imageIndex == -1) {
            return -1;
        }
        VariableSizedImageData.CurrentImageIndex = imageIndex;
        return imageIndex;
    }
    static getNextImageIndex(pImageIndex, TableIndex) {
        let Addr;
        let Ptr;
        let ImageIndexMin;
        let ImageIndexMax;
        if (!VariableSizedImageData.TableAddress) {
            return -1;
        }
        if (VariableSizedImageData.TableAddress >= ROM.size) {
            return -1;
        }
        if (TableIndex < VariableSizedImageData.minTableIndex ||
            TableIndex > VariableSizedImageData.maxTableIndex) {
            return -1;
        }
        Addr = this.getROMAddressOfVariableSizedImageTable(TableIndex);
        if (Addr == -1) {
            return -1;
        }
        Ptr = Addr;
        while ((ROM.byteAtAddr(Ptr) & 0xff) != 0x00) {
            ImageIndexMin = ROM.byteAtAddr(Ptr++) & 0xff;
            ImageIndexMax = ROM.byteAtAddr(Ptr++) & 0xff;
            if (ImageIndexMin > ImageIndexMax) {
                return -1;
            }
            if ((pImageIndex & 0xff) < (ImageIndexMin & 0xff)) {
                return ImageIndexMin;
            }
            if ((pImageIndex & 0xff) < (ImageIndexMax & 0xff)) {
                return pImageIndex + 1;
            }
        }
        return -1;
    }
    static getLastImageIndex(pImageIndex, TableIndex) {
        let ImageIndex = 0;
        let hit = 0;
        let counter = 0;
        let imageIndeces = [0];
        imageIndeces.length = 0;
        while (ImageIndex != -1) {
            ImageIndex = this.getNextImageIndex(ImageIndex, TableIndex);
            counter++;
            if (ImageIndex != -1) {
                pImageIndex = ImageIndex;
                imageIndeces.push(ImageIndex);
            }
            hit = 1;
        }
        if (hit == 0) {
            return [-1, imageIndeces];
        }
        return [pImageIndex, imageIndeces];
    }
    static getPrevImageIndex(pImageIndex, TableIndex) {
        let Addr;
        let Ptr;
        let ImageIndexMin;
        let ImageIndexMax;
        let windUp;
        if (!VariableSizedImageData.TableAddress) {
            return -1;
        }
        if (VariableSizedImageData.TableAddress >= ROM.size) {
            return -1;
        }
        if (TableIndex < VariableSizedImageData.minTableIndex ||
            TableIndex > VariableSizedImageData.maxTableIndex) {
            return -1;
        }
        if (pImageIndex == null) {
            return -1;
        }
        Addr = this.getROMAddressOfVariableSizedImageTable(TableIndex);
        if (Addr == -1) {
            return -1;
        }
        Ptr = Addr;
        windUp = 0;
        while ((ROM.byteAtAddr(Ptr) & 0xff) != 0x00) {
            Ptr += 2;
            windUp++;
        }
        while (windUp != 0) {
            Ptr -= 2;
            windUp--;
            ImageIndexMin = ROM.byteAtAddr(Ptr) & 0xff;
            ImageIndexMax = ROM.byteAtAddr(Ptr + 1) & 0xff;
            if (ImageIndexMin > ImageIndexMax) {
                return -1;
            }
            if ((pImageIndex & 0xff) > (ImageIndexMax & 0xff)) {
                pImageIndex = ImageIndexMax;
                return pImageIndex;
            }
            if ((pImageIndex & 0xff) > (ImageIndexMin & 0xff)) {
                pImageIndex = pImageIndex - 1;
                return pImageIndex;
            }
        }
        return -1;
    }
    static getROMAddressOfVariableSizedImageTable(TableIndex) {
        const result = this.extractWPCAddrAndPageOfImageTable(TableIndex);
        const Addr = result[0];
        const Page = result[1];
        if (Addr == -1) {
            return -1;
        }
        const romAddr = this.getROMAddressFromWPCAddrAndPage(Addr, Page);
        if (romAddr == -1) {
            return -1;
        }
        return romAddr;
    }
    static extractWPCAddrAndPageOfImageTable(TableIndex) {
        let romAddr;
        let Ptr;
        let Addr;
        let Page;
        if (!VariableSizedImageData.TableAddress) {
            return [-1, -1];
        }
        if (VariableSizedImageData.TableAddress >= ROM.size) {
            return [-1, -1];
        }
        if (VariableSizedImageData.CurrentTableIndex <
            VariableSizedImageData.minTableIndex ||
            VariableSizedImageData.CurrentTableIndex >
                VariableSizedImageData.maxTableIndex) {
            return [-1, -1];
        }
        romAddr =
            DataParser.getAddrToWPCAddressOfVariableSizedImageTable(TableIndex);
        if (romAddr == -1) {
            return [-1, -1];
        }
        Ptr = romAddr;
        Addr = ROM.byteAtAddr(Ptr) & 0xff;
        Addr = Addr << 8;
        Addr = Addr | (ROM.byteAtAddr(Ptr + 1) & 0xff);
        Addr = Addr & 0xffff;
        Page = ROM.byteAtAddr(Ptr + 2) & 0xff;
        {
            let TempAddr;
            let TempPage;
            romAddr = this.getROMAddressFromWPCAddrAndPage(Addr, Page);
            if (romAddr == -1) {
                return [-1, -1];
            }
            Ptr = romAddr;
            TempAddr = ROM.byteAtAddr(Ptr) & 0xff;
            TempAddr = TempAddr << 8;
            TempAddr = TempAddr | (ROM.byteAtAddr(Ptr + 1) & 0xff);
            TempAddr = TempAddr & 0xffff;
            TempPage = ROM.byteAtAddr(Ptr + 2) & 0xff;
            logStr(`Testing Tempaddr ${toHex(TempAddr)} and Page ${toHex(TempPage)}`);
            if (TempAddr >= WPC.BaseCodeAddrPagedRom &&
                TempAddr < WPC.BaseCodeAddrPagedRom + WPC.PageLength) {
                Addr = TempAddr;
            }
            logStr(`extractWPCAddrAndPageOfImageTable() FIXUP, Addr fixed to ${toHex(Addr)},${toHex(Page)}`);
        }
        return [Addr, Page];
    }
    static getROMAddressFromWPCAddrAndPage(Addr, Page) {
        let romAddr;
        if (Addr >= WPC.BaseCodeAddrNonpagedRom &&
            Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength) {
            if (Page != WPC.NonpagedBankIndicator) {
                logStr(`getROMAddressFromWPCAddrAndPage() Non-banked WPC addr ${Addr} followed by page byte ${Page}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${WPC.NonpagedBankIndicator}`);
                Page = WPC.NonpagedBankIndicator;
            }
        }
        if (Page == WPC.NonpagedBankIndicator &&
            Addr >= WPC.BaseCodeAddrNonpagedRom &&
            Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength) {
            romAddr =
                (ROM.totalPages - 2) * WPC.PageLength +
                    (Addr - WPC.BaseCodeAddrNonpagedRom);
        }
        else if (Page >= ROM.basePageIndex &&
            Page < ROM.basePageIndex + ROM.totalPages - 2 &&
            Addr >= WPC.BaseCodeAddrPagedRom &&
            Addr < WPC.BaseCodeAddrNonpagedRom) {
            romAddr =
                (Page - ROM.basePageIndex) * WPC.PageLength +
                    (Addr - WPC.BaseCodeAddrPagedRom);
        }
        else {
            logStr(`Invalid WPC Addr and Page, ${toHex(Addr)},${toHex(Page)}, BasePage ${toHex(ROM.basePageIndex)}, TotalPages ${ROM.totalPages}`);
            return -1;
        }
        if (romAddr >= ROM.size) {
            logStr(`Unexpected: Calculated addr in ROM ${romAddr} is greater than determined ROM size ${ROM.size}`);
            return -1;
        }
        return romAddr;
    }
    static getAddrToWPCAddressOfVariableSizedImageTable(TableIndex) {
        let romAddr;
        if (!VariableSizedImageData.TableAddress) {
            return -1;
        }
        if (VariableSizedImageData.TableAddress >= ROM.size) {
            return -1;
        }
        if (TableIndex < VariableSizedImageData.minTableIndex ||
            TableIndex > VariableSizedImageData.maxTableIndex) {
            return -1;
        }
        romAddr = VariableSizedImageData.TableAddress + 3 * TableIndex;
        if (romAddr >= ROM.size) {
            return -1;
        }
        return romAddr;
    }
    static getROMAddressFromAddrOf3ByteWPCAddrPage(pSrc) {
        let Addr;
        let Page;
        const result = DataParser.extractWPCAddrAndPageFromBuffer(pSrc);
        Addr = result[0];
        Page = result[1];
        if (Addr == -1) {
            logStr(`Error from ExtractWPCAddrAndPageFromBuffer(), Passed it ptr to: ${ROM.byteAtAddr(pSrc) & 0xff} ${ROM.byteAtAddr(pSrc + 1) & 0xff} ${ROM.byteAtAddr(pSrc + 2) & 0xff}`);
            return -1;
        }
        logStr(`getROMAddressFromAddrOf3ByteWPCAddrPage() WPC TableAddress ${toHex(Addr)},${toHex(Page)}`);
        Addr = DataParser.getROMAddressFromWPCAddrAndPage(Addr, Page);
        if (Addr == -1) {
            logStr(`Error from getROMAddressFromWPCAddrAndPage(), Passed it WPC Addr ${Addr},${Page}`);
            return -1;
        }
        logStr(`getROMAddressFromAddrOf3ByteWPCAddrPage() ROM TableAddress ${toHex(Addr)}`);
        return Addr;
    }
    static getROMAddressOfVariableSizedImageIndex(TableIndex, ImageIndex) {
        let Addr;
        let Page;
        let Ptr;
        let TableHeight;
        let TableSpacing;
        let ImageIndexMin, ImageIndexMax, ImageNum, ImageFound;
        Addr = DataParser.getROMAddressOfVariableSizedImageTable(TableIndex);
        if (Addr == -1) {
            return -1;
        }
        if (Addr >= ROM.size) {
            return -1;
        }
        Ptr = Addr;
        ImageNum = ImageFound = 0;
        while ((ROM.byteAtAddr(Ptr) & 0xff) != 0x00) {
            ImageIndexMin = ROM.byteAtAddr(Ptr++) & 0xff;
            ImageIndexMax = ROM.byteAtAddr(Ptr++) & 0xff;
            if (ImageIndexMin > ImageIndexMax) {
                return -1;
            }
            if (ImageFound == 0) {
                while (ImageIndexMin <= ImageIndexMax) {
                    if (ImageIndex <= ImageIndexMin) {
                        logStr(`getROMAddressOfVariableSizedImageIndex() ImageFound, ImageNum ${ImageNum}, ImageIndexMin ${ImageIndexMin}, ImageIndexMax ${ImageIndexMax}`);
                        ImageFound = 1;
                        break;
                    }
                    ImageNum++;
                    ImageIndexMin++;
                }
            }
        }
        Ptr++;
        TableHeight = ROM.byteAtAddr(Ptr++);
        TableSpacing = ROM.byteAtAddr(Ptr++);
        Ptr += ImageNum * 2;
        Addr = ROM.byteAtAddr(Ptr) & 0xff;
        Addr = Addr << 8;
        Addr |= ROM.byteAtAddr(Ptr + 1) & 0xff;
        Addr &= 0xffff;
        const result = DataParser.extractWPCAddrAndPageOfImageTable(TableIndex);
        Page = result[1];
        if (Page == -1) {
            return -1;
        }
        Addr = DataParser.getROMAddressFromWPCAddrAndPage(Addr, Page);
        if (Addr == -1) {
            return -1;
        }
        logStr(`getROMAddressOfVariableSizedImageIndex() TableHeight ${TableHeight}, TableSpacing ${TableSpacing} ImageIndex ${ImageIndex} at ${Addr}`);
        return Addr;
    }
    static extractWPCAddrAndPageFromBuffer(pSrc) {
        let Addr;
        let Page;
        Addr = ROM.byteAtAddr(pSrc) & 0xff;
        Addr = Addr << 8;
        Addr = Addr | (ROM.byteAtAddr(pSrc + 1) & 0xff);
        Addr = Addr & 0xffff;
        Page = ROM.byteAtAddr(pSrc + 2) & 0xff;
        if (Addr >= WPC.BaseCodeAddrNonpagedRom &&
            Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength) {
            if (Page != WPC.NonpagedBankIndicator) {
                logStr(`extractWPCAddrAndPageFromBuffer() Non-banked WPC addr ${toHex(Addr)} followed by page byte ${toHex(Page)}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${WPC.NonpagedBankIndicator}`);
                Page = WPC.NonpagedBankIndicator;
            }
        }
        if (Addr != null) {
            if ((Addr >= WPC.BaseCodeAddrPagedRom &&
                Addr < WPC.BaseCodeAddrPagedRom + WPC.PageLength) ||
                (Addr >= WPC.BaseCodeAddrNonpagedRom &&
                    Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength)) {
            }
            else {
                logStr(`Expected a WPC Addr, but read ${toHex(Addr)}`);
                return [-1, -1];
            }
        }
        if (Page != null) {
            if ((Page >= ROM.basePageIndex &&
                Page < ROM.basePageIndex + ROM.totalPages) ||
                Page == WPC.NonpagedBankIndicator) {
            }
            else {
                logStr(`Expected a WPC Page Number, but read ${Page}, Base is ${ROM.basePageIndex}, Total Pages ${ROM.totalPages}`);
                return [-1, -1];
            }
        }
        return [Addr, Page];
    }
    static processHitType(HitType, HitTablePtr, HitPagePtr, Ptr) {
        let Addr;
        let HitBuf = [0, 0, 0];
        let pTbl;
        switch (HitType) {
            case HitTypes.AddrAddrAddr:
                logStr(`Potential Match. HitType ${toHex(ROM.byteAtAddr(Ptr - 1) & 0xff)}, HitBytes ${toHex(ROM.byteAtAddr(HitTablePtr) & 0xff)} ${toHex(ROM.byteAtAddr(HitTablePtr + 1) & 0xff)}`);
                Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitTablePtr);
                if (Addr == -1) {
                    logStr(`Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${HitTablePtr & 0xff} ${(HitTablePtr + 1) & 0xff}`);
                    return -1;
                }
                logStr(`HitTypes.AddrAddrAddr derived ROM TableAddressAddress ${Addr}, going to HitTypes.AddrAddr`);
                HitTablePtr = ROM.byteAtAddr(Addr);
            case HitTypes.AddrAddr:
                logStr(`Potential Match. HitType ${toHex(ROM.byteAtAddr(Ptr - 1) & 0xff)}, HitBytes ${toHex(ROM.byteAtAddr(HitTablePtr) & 0xff)} ${toHex(ROM.byteAtAddr(HitTablePtr + 1) & 0xff)}`);
                Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitTablePtr);
                if (Addr == -1) {
                    logStr(`Error from GetROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${HitTablePtr & 0xff} ${(HitTablePtr + 1) & 0xff}`);
                    return -1;
                }
                logStr(`HitTypes.AddrAddr derived TableAddress of ${toHex(Addr)} going to HitTypes.Addr`);
                HitTablePtr = Addr;
                HitPagePtr = Addr + 2;
            case HitTypes.Addr:
                if (HitTablePtr == null) {
                    logStr("HitTypes.Addr, but HitTablePtr is NULL");
                    return -1;
                }
                HitBuf[0] = HitTablePtr;
                HitBuf[1] = HitTablePtr + 1;
                if (HitPagePtr == null) {
                    let Addr;
                    Addr = HitBuf[0] & 0xff;
                    Addr = Addr << 8;
                    Addr = Addr | (HitBuf[1] & 0xff);
                    Addr = Addr & 0xffff;
                    if (!(Addr >= WPC.BaseCodeAddrNonpagedRom &&
                        Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength)) {
                        logStr(`HitTypes.Addr, but HitPagePtr is NULL, and Addr is in paged ROM`);
                        return -1;
                    }
                    HitBuf[2] = WPC.NonpagedBankIndicator;
                }
                else {
                    HitBuf[2] = ROM.byteAtAddr(HitPagePtr);
                }
                logStr(`Potential Match. HitType ${toHex(ROM.byteAtAddr(Ptr - 1) & 0xff)}, HitBytes ${toHex(ROM.byteAtAddr(HitBuf[0]) & 0xff)} ${toHex(ROM.byteAtAddr(HitBuf[1]) & 0xff)} ${toHex(HitBuf[2] & 0xff)}`);
                pTbl = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitBuf[0]);
                if (pTbl != -1) {
                    logStr("Table Found!");
                    return pTbl;
                }
                logStr(`Error deriving table addr from hit, HitType ${(Ptr - 1) & 0xff}, HitBytes ${HitBuf[0] & 0xff} ${HitBuf[1] & 0xff} ${HitBuf[2] & 0xff}. Will keep looking. May need to debug by opening window while pressing <shift>`);
                break;
            case HitTypes.None:
                return 0;
            default:
                logStr("Unexpected HitType");
                break;
        }
        return -1;
    }
    static preAnalyzeVariableSizedImageTable() {
        let Ptr;
        let Addr;
        let TableCount = 0;
        ROM.vSImageTableMap.length = 0;
        if (!VariableSizedImageData.TableAddress) {
            logStr(`Unexpected NULL ${VariableSizedImageData.TableAddress}`);
        }
        if (VariableSizedImageData.TableAddress >= ROM.size) {
            logStr(`Unexpected table address ${VariableSizedImageData.TableAddress} is >= ${ROM.size}`);
        }
        Ptr = VariableSizedImageData.TableAddress;
        let continueLooping = true;
        while (continueLooping) {
            Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(Ptr);
            if (Addr == -1) {
                continueLooping = false;
            }
            else {
                VariableSizedImageData.maxTableIndex++;
                const result = DataParser.getLastImageIndex(-1, VariableSizedImageData.maxTableIndex - 1);
                const ImageIndex = result[0];
                ROM.vSImageTableMap.push(result[1]);
                if (ImageIndex == -1) {
                    VariableSizedImageData.maxTableIndex--;
                    logStr(`Stopped looking for image tables due to getLastImageIndex() error on TableIndex ${VariableSizedImageData.maxTableIndex}`);
                    continueLooping = false;
                }
                Ptr += 3;
                TableCount++;
            }
        }
        logStr(`Determined TableCount: ${TableCount}%d`);
        if (TableCount == 0) {
            logStr("Found 0 table entries");
            return -1;
        }
        VariableSizedImageData.minTableIndex = 0;
        VariableSizedImageData.maxTableIndex = TableCount - 1;
        VariableSizedImageData.maxImageIndex = DataParser.getLastImageIndex(VariableSizedImageData.maxImageIndex, VariableSizedImageData.maxTableIndex)[0];
        if (VariableSizedImageData.maxImageIndex == -1) {
            logStr(`Error looking up max image index for last table index ${VariableSizedImageData.maxTableIndex}`);
            return -1;
        }
        VariableSizedImageData.minImageIndex = DataParser.getFirstImageIndex(VariableSizedImageData.minTableIndex);
        if (VariableSizedImageData.minTableIndex == -1) {
            logStr(`Error looking up min image index for first table index ${VariableSizedImageData.maxTableIndex})`);
            return -1;
        }
        logStr(`Determined maxTableIndex ${VariableSizedImageData.maxTableIndex}, maxImageIndex ${VariableSizedImageData.maxImageIndex}`);
        return 0;
    }
    static getVariableSizedImageTableMetadata(TableIndex) {
        let Addr;
        let Ptr;
        let TableHeight;
        let TableSpacing;
        Addr = DataParser.getROMAddressOfVariableSizedImageTable(TableIndex);
        if (Addr == -1) {
            return [-1, -1];
        }
        if (Addr >= ROM.size) {
            return [-1, -1];
        }
        Ptr = Addr;
        while ((ROM.byteAtAddr(Ptr++) & 0xff) != 0x00)
            ;
        TableHeight = ROM.byteAtAddr(Ptr++);
        TableSpacing = ROM.byteAtAddr(Ptr++);
        return [TableHeight, TableSpacing];
    }
}

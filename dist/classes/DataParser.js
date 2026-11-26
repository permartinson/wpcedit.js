import { HitTypes, DataTypes, WPC } from "../resources/Constants.js";
import { toHex, logStr } from "../resources/Helpers.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
import { ROM } from "../stores/ROM.js";
function wordAt(pos) {
    return (((ROM.byteAtAddr(pos) & 0xff) << 8) | (ROM.byteAtAddr(pos + 1) & 0xff)) & 0xffff;
}
function isNonpagedAddr(addr) {
    return (addr >= WPC.BaseCodeAddrNonpagedRom &&
        addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength);
}
function isPagedAddr(addr) {
    return (addr >= WPC.BaseCodeAddrPagedRom &&
        addr < WPC.BaseCodeAddrPagedRom + WPC.PageLength);
}
export class DataParser {
    constructor() { }
    static init() {
        if (DataParser.instance) {
            return this.instance;
        }
        this.instance = new DataParser();
        return this.instance;
    }
    static initTableAddrs(dataType) {
        let ptr = 0;
        logStr(`Searching ROM for Master Animation Table Address`);
        for (let page = 0; page < ROM.totalPages; page++) {
            for (let pageByteIdx = 0; pageByteIdx < WPC.PageLength; pageByteIdx++) {
                if ((ROM.byteAtAddr(ptr++) & 0xff) != 0xbe) {
                    continue;
                }
                if (pageByteIdx >= WPC.PageLength - 16) {
                    continue;
                }
                if (!((ROM.byteAtAddr(ptr + 2) & 0xff) == 0x3a &&
                    (ROM.byteAtAddr(ptr + 3) & 0xff) == 0x58 &&
                    (ROM.byteAtAddr(ptr + 4) & 0xff) == 0x3a &&
                    (ROM.byteAtAddr(ptr + 5) & 0xff) == 0xd6 &&
                    (ROM.byteAtAddr(ptr + 7) & 0xff) == 0x34 &&
                    (ROM.byteAtAddr(ptr + 8) & 0xff) == 0x04 &&
                    ((ROM.byteAtAddr(ptr + 9) & 0xff) == 0xf6 ||
                        (ROM.byteAtAddr(ptr + 9) & 0xff) == 0xbd) &&
                    ((ROM.byteAtAddr(ptr + 12) & 0xff) == 0xbd ||
                        (ROM.byteAtAddr(ptr + 12) & 0xff) == 0xf6))) {
                    continue;
                }
                let hitTablePtr = ptr;
                let hitPagePtr = ptr + 2;
                let romAddr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(hitTablePtr);
                if (romAddr === null) {
                    logStr(`Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Font Table Pointer opcode: ${toHex(ROM.byteAtAddr(hitTablePtr))} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`);
                    return -1;
                }
                logStr(`Address in ROM of Font Table Pointer ${toHex(romAddr)}`);
                if (dataType == DataTypes.FontData) {
                    const fontTable = DataParser.processHitType(HitTypes.AddrAddr, hitTablePtr, hitPagePtr, ptr);
                    VariableSizedImageData.tableAddress = fontTable !== null && fontTable !== void 0 ? fontTable : -1;
                    if (fontTable === null) {
                        logStr(`Error from ProcessHitType while trying to process Font Table Pointer opcode: ${toHex(ROM.byteAtAddr(hitTablePtr))} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`);
                        continue;
                    }
                    logStr(`Found Address in ROM of Font Table ${toHex(VariableSizedImageData.tableAddress)}`);
                }
                romAddr = DataParser.skipPointer(romAddr);
                logStr(`Address in ROM of Graphics Table Pointer ${toHex(romAddr)}`);
                hitTablePtr = romAddr;
                hitPagePtr = romAddr + 2;
                const graphicsTable = this.processHitType(HitTypes.Addr, hitTablePtr, hitPagePtr, ptr);
                FullFrameImageData.tableAddress = graphicsTable !== null && graphicsTable !== void 0 ? graphicsTable : -1;
                if (graphicsTable === null) {
                    logStr(`Error from processHitType while trying to process Graphic Table Pointer: ${toHex(ROM.byteAtAddr(hitTablePtr))} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`);
                    if (dataType == DataTypes.FontData) {
                        return 0;
                    }
                    return -1;
                }
                logStr(`Found Address in ROM of Graphics Table ${toHex(FullFrameImageData.tableAddress)}`);
                if (dataType != DataTypes.AniData) {
                    return 0;
                }
                romAddr = DataParser.skipPointer(romAddr);
                logStr(`Address in ROM of Animation Table Pointer ${toHex(romAddr)}`);
                hitTablePtr = romAddr;
                hitPagePtr = romAddr + 2;
                const animationTable = this.processHitType(HitTypes.Addr, hitTablePtr, hitPagePtr, ptr);
                VariableSizedImageData.tableAddress = animationTable !== null && animationTable !== void 0 ? animationTable : -1;
                if (animationTable === null) {
                    logStr(`Error from processHitType while trying to process Animation Table Pointer: ${toHex(ROM.byteAtAddr(hitTablePtr))} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`);
                    return -1;
                }
                logStr(`Found Address in ROM of Animation Table ${toHex(VariableSizedImageData.tableAddress)}`);
                ROM.startPtr = ptr;
                return 0;
            }
        }
    }
    static skipPointer(pos) {
        const wpcAddr = wordAt(pos);
        if (isNonpagedAddr(wpcAddr) &&
            (ROM.byteAtAddr(pos + 2) & 0xff) != WPC.NonpagedBankIndicator) {
            return pos + 2;
        }
        return pos + 3;
    }
    static getFirstImageIndex(tableIndex) {
        const imageIndex = this.getNextImageIndex(0, tableIndex);
        if (imageIndex == -1) {
            return -1;
        }
        VariableSizedImageData.currentImageIndex = imageIndex;
        return imageIndex;
    }
    static getNextImageIndex(imageIndex, tableIndex) {
        if (!DataParser.isValidTableIndex(tableIndex)) {
            return -1;
        }
        const addr = this.getROMAddressOfVariableSizedImageTable(tableIndex);
        if (addr === null) {
            return -1;
        }
        let ptr = addr;
        while ((ROM.byteAtAddr(ptr) & 0xff) != 0x00) {
            const imageIndexMin = ROM.byteAtAddr(ptr++) & 0xff;
            const imageIndexMax = ROM.byteAtAddr(ptr++) & 0xff;
            if (imageIndexMin > imageIndexMax) {
                return -1;
            }
            if ((imageIndex & 0xff) < (imageIndexMin & 0xff)) {
                return imageIndexMin;
            }
            if ((imageIndex & 0xff) < (imageIndexMax & 0xff)) {
                return imageIndex + 1;
            }
        }
        return -1;
    }
    static getLastImageIndex(imageIndex, tableIndex) {
        const indices = [];
        let next = this.getNextImageIndex(0, tableIndex);
        while (next != -1) {
            imageIndex = next;
            indices.push(next);
            next = this.getNextImageIndex(next, tableIndex);
        }
        return { last: imageIndex, indices };
    }
    static getPrevImageIndex(imageIndex, tableIndex) {
        if (!DataParser.isValidTableIndex(tableIndex)) {
            return -1;
        }
        if (imageIndex == null) {
            return -1;
        }
        const addr = this.getROMAddressOfVariableSizedImageTable(tableIndex);
        if (addr === null) {
            return -1;
        }
        let ptr = addr;
        let windUp = 0;
        while ((ROM.byteAtAddr(ptr) & 0xff) != 0x00) {
            ptr += 2;
            windUp++;
        }
        while (windUp != 0) {
            ptr -= 2;
            windUp--;
            const imageIndexMin = ROM.byteAtAddr(ptr) & 0xff;
            const imageIndexMax = ROM.byteAtAddr(ptr + 1) & 0xff;
            if (imageIndexMin > imageIndexMax) {
                return -1;
            }
            if ((imageIndex & 0xff) > (imageIndexMax & 0xff)) {
                return imageIndexMax;
            }
            if ((imageIndex & 0xff) > (imageIndexMin & 0xff)) {
                return imageIndex - 1;
            }
        }
        return -1;
    }
    static isValidTableIndex(tableIndex) {
        if (!VariableSizedImageData.tableAddress) {
            return false;
        }
        if (VariableSizedImageData.tableAddress >= ROM.size) {
            return false;
        }
        if (tableIndex < VariableSizedImageData.minTableIndex ||
            tableIndex > VariableSizedImageData.maxTableIndex) {
            return false;
        }
        return true;
    }
    static getROMAddressOfVariableSizedImageTable(tableIndex) {
        const pointer = this.extractWPCAddrAndPageOfImageTable(tableIndex);
        if (pointer === null) {
            return null;
        }
        return this.getROMAddressFromWPCAddrAndPage(pointer.addr, pointer.page);
    }
    static extractWPCAddrAndPageOfImageTable(tableIndex) {
        if (!DataParser.isValidTableIndex(tableIndex)) {
            return null;
        }
        let romAddr = DataParser.getAddrToWPCAddressOfVariableSizedImageTable(tableIndex);
        if (romAddr === null) {
            return null;
        }
        let addr = wordAt(romAddr);
        const page = ROM.byteAtAddr(romAddr + 2) & 0xff;
        {
            romAddr = this.getROMAddressFromWPCAddrAndPage(addr, page);
            if (romAddr === null) {
                return null;
            }
            const tempAddr = wordAt(romAddr);
            const tempPage = ROM.byteAtAddr(romAddr + 2) & 0xff;
            logStr(`Testing Tempaddr ${toHex(tempAddr)} and Page ${toHex(tempPage)}`);
            if (isPagedAddr(tempAddr)) {
                addr = tempAddr;
            }
            logStr(`extractWPCAddrAndPageOfImageTable() FIXUP, Addr fixed to ${toHex(addr)},${toHex(page)}`);
        }
        return { addr, page };
    }
    static getROMAddressFromWPCAddrAndPage(addr, page) {
        let romAddr;
        if (isNonpagedAddr(addr)) {
            if (page != WPC.NonpagedBankIndicator) {
                logStr(`getROMAddressFromWPCAddrAndPage() Non-banked WPC addr ${addr} followed by page byte ${page}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${WPC.NonpagedBankIndicator}`);
                page = WPC.NonpagedBankIndicator;
            }
        }
        if (page == WPC.NonpagedBankIndicator && isNonpagedAddr(addr)) {
            romAddr =
                (ROM.totalPages - 2) * WPC.PageLength +
                    (addr - WPC.BaseCodeAddrNonpagedRom);
        }
        else if (page >= ROM.basePageIndex &&
            page < ROM.basePageIndex + ROM.totalPages - 2 &&
            addr >= WPC.BaseCodeAddrPagedRom &&
            addr < WPC.BaseCodeAddrNonpagedRom) {
            romAddr =
                (page - ROM.basePageIndex) * WPC.PageLength +
                    (addr - WPC.BaseCodeAddrPagedRom);
        }
        else {
            logStr(`Invalid WPC Addr and Page, ${toHex(addr)},${toHex(page)}, BasePage ${toHex(ROM.basePageIndex)}, TotalPages ${ROM.totalPages}`);
            return null;
        }
        if (romAddr >= ROM.size) {
            logStr(`Unexpected: Calculated addr in ROM ${romAddr} is greater than determined ROM size ${ROM.size}`);
            return null;
        }
        return romAddr;
    }
    static getAddrToWPCAddressOfVariableSizedImageTable(tableIndex) {
        if (!DataParser.isValidTableIndex(tableIndex)) {
            return null;
        }
        const romAddr = VariableSizedImageData.tableAddress + 3 * tableIndex;
        if (romAddr >= ROM.size) {
            return null;
        }
        return romAddr;
    }
    static getROMAddressFromAddrOf3ByteWPCAddrPage(src) {
        const pointer = DataParser.extractWPCAddrAndPageFromBuffer(src);
        if (pointer === null) {
            logStr(`Error from ExtractWPCAddrAndPageFromBuffer(), Passed it ptr to: ${ROM.byteAtAddr(src) & 0xff} ${ROM.byteAtAddr(src + 1) & 0xff} ${ROM.byteAtAddr(src + 2) & 0xff}`);
            return null;
        }
        return DataParser.getROMAddressFromWPCPointer(pointer);
    }
    static getROMAddressFromWPCPointer(pointer) {
        logStr(`getROMAddressFromAddrOf3ByteWPCAddrPage() WPC TableAddress ${toHex(pointer.addr)},${toHex(pointer.page)}`);
        const romAddr = DataParser.getROMAddressFromWPCAddrAndPage(pointer.addr, pointer.page);
        if (romAddr === null) {
            logStr(`Error from getROMAddressFromWPCAddrAndPage(), Passed it WPC Addr ${pointer.addr},${pointer.page}`);
            return null;
        }
        logStr(`getROMAddressFromAddrOf3ByteWPCAddrPage() ROM TableAddress ${toHex(romAddr)}`);
        return romAddr;
    }
    static getROMAddressOfVariableSizedImageIndex(tableIndex, imageIndex) {
        let addr = DataParser.getROMAddressOfVariableSizedImageTable(tableIndex);
        if (addr === null) {
            return null;
        }
        if (addr >= ROM.size) {
            return null;
        }
        let ptr = addr;
        let imageNum = 0;
        let imageFound = false;
        while ((ROM.byteAtAddr(ptr) & 0xff) != 0x00) {
            let imageIndexMin = ROM.byteAtAddr(ptr++) & 0xff;
            const imageIndexMax = ROM.byteAtAddr(ptr++) & 0xff;
            if (imageIndexMin > imageIndexMax) {
                return null;
            }
            if (!imageFound) {
                while (imageIndexMin <= imageIndexMax) {
                    if (imageIndex <= imageIndexMin) {
                        logStr(`getROMAddressOfVariableSizedImageIndex() ImageFound, ImageNum ${imageNum}, ImageIndexMin ${imageIndexMin}, ImageIndexMax ${imageIndexMax}`);
                        imageFound = true;
                        break;
                    }
                    imageNum++;
                    imageIndexMin++;
                }
            }
        }
        ptr++;
        const tableHeight = ROM.byteAtAddr(ptr++);
        const tableSpacing = ROM.byteAtAddr(ptr++);
        ptr += imageNum * 2;
        addr = wordAt(ptr);
        const pointer = DataParser.extractWPCAddrAndPageOfImageTable(tableIndex);
        if (pointer === null) {
            return null;
        }
        const romAddr = DataParser.getROMAddressFromWPCAddrAndPage(addr, pointer.page);
        if (romAddr === null) {
            return null;
        }
        logStr(`getROMAddressOfVariableSizedImageIndex() TableHeight ${tableHeight}, TableSpacing ${tableSpacing} ImageIndex ${imageIndex} at ${romAddr}`);
        return romAddr;
    }
    static extractWPCAddrAndPageFromBuffer(src) {
        return DataParser.validateWPCPointer(wordAt(src), ROM.byteAtAddr(src + 2) & 0xff);
    }
    static validateWPCPointer(addr, page) {
        if (isNonpagedAddr(addr)) {
            if (page != WPC.NonpagedBankIndicator) {
                logStr(`extractWPCAddrAndPageFromBuffer() Non-banked WPC addr ${toHex(addr)} followed by page byte ${toHex(page)}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${WPC.NonpagedBankIndicator}`);
                page = WPC.NonpagedBankIndicator;
            }
        }
        if (!isPagedAddr(addr) && !isNonpagedAddr(addr)) {
            logStr(`Expected a WPC Addr, but read ${toHex(addr)}`);
            return null;
        }
        if (!((page >= ROM.basePageIndex &&
            page < ROM.basePageIndex + ROM.totalPages) ||
            page == WPC.NonpagedBankIndicator)) {
            logStr(`Expected a WPC Page Number, but read ${page}, Base is ${ROM.basePageIndex}, Total Pages ${ROM.totalPages}`);
            return null;
        }
        return { addr, page };
    }
    static processHitType(hitType, hitTablePtr, hitPagePtr, ptr) {
        switch (hitType) {
            case HitTypes.AddrAddrAddr: {
                logStr(`Potential Match. HitType ${toHex(ROM.byteAtAddr(ptr - 1) & 0xff)}, HitBytes ${toHex(ROM.byteAtAddr(hitTablePtr) & 0xff)} ${toHex(ROM.byteAtAddr(hitTablePtr + 1) & 0xff)}`);
                const addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(hitTablePtr);
                if (addr === null) {
                    logStr(`Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${toHex(ROM.byteAtAddr(hitTablePtr))} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`);
                    return null;
                }
                logStr(`HitTypes.AddrAddrAddr derived ROM TableAddressAddress ${addr}, going to HitTypes.AddrAddr`);
                hitTablePtr = addr;
            }
            case HitTypes.AddrAddr: {
                logStr(`Potential Match. HitType ${toHex(ROM.byteAtAddr(ptr - 1) & 0xff)}, HitBytes ${toHex(ROM.byteAtAddr(hitTablePtr) & 0xff)} ${toHex(ROM.byteAtAddr(hitTablePtr + 1) & 0xff)}`);
                const addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(hitTablePtr);
                if (addr === null) {
                    logStr(`Error from GetROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${toHex(ROM.byteAtAddr(hitTablePtr))} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`);
                    return null;
                }
                logStr(`HitTypes.AddrAddr derived TableAddress of ${toHex(addr)} going to HitTypes.Addr`);
                hitTablePtr = addr;
                hitPagePtr = addr + 2;
            }
            case HitTypes.Addr: {
                const hitAddr = wordAt(hitTablePtr);
                let hitPage;
                if (hitPagePtr === null) {
                    if (!isNonpagedAddr(hitAddr)) {
                        logStr(`HitTypes.Addr, but HitPagePtr is NULL, and Addr is in paged ROM`);
                        return null;
                    }
                    hitPage = WPC.NonpagedBankIndicator;
                }
                else {
                    hitPage = ROM.byteAtAddr(hitPagePtr) & 0xff;
                }
                logStr(`Potential Match. HitType ${toHex(ROM.byteAtAddr(ptr - 1) & 0xff)}, HitBytes ${toHex(hitAddr >> 8)} ${toHex(hitAddr & 0xff)} ${toHex(hitPage)}`);
                const pointer = DataParser.validateWPCPointer(hitAddr, hitPage);
                const table = pointer === null ? null : DataParser.getROMAddressFromWPCPointer(pointer);
                if (table !== null) {
                    logStr("Table Found!");
                    return table;
                }
                logStr(`Error deriving table addr from hit, HitType ${toHex(ROM.byteAtAddr(ptr - 1) & 0xff)}, HitBytes ${toHex(hitAddr >> 8)} ${toHex(hitAddr & 0xff)} ${toHex(hitPage)}. Will keep looking. May need to debug by opening window while pressing <shift>`);
                return null;
            }
            case HitTypes.None:
                return 0;
            default:
                logStr("Unexpected HitType");
                return null;
        }
    }
    static preAnalyzeVariableSizedImageTable() {
        let tableCount = 0;
        ROM.vSImageTableMap.length = 0;
        if (!VariableSizedImageData.tableAddress) {
            logStr(`Unexpected NULL ${VariableSizedImageData.tableAddress}`);
        }
        if (VariableSizedImageData.tableAddress >= ROM.size) {
            logStr(`Unexpected table address ${VariableSizedImageData.tableAddress} is >= ${ROM.size}`);
        }
        let ptr = VariableSizedImageData.tableAddress;
        while (DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(ptr) !== null) {
            VariableSizedImageData.maxTableIndex++;
            const result = DataParser.getLastImageIndex(-1, VariableSizedImageData.maxTableIndex - 1);
            ROM.vSImageTableMap.push(result.indices);
            ptr += 3;
            tableCount++;
            if (result.last == -1) {
                VariableSizedImageData.maxTableIndex--;
                logStr(`Stopped looking for image tables due to getLastImageIndex() error on TableIndex ${VariableSizedImageData.maxTableIndex}`);
                break;
            }
        }
        logStr(`Determined TableCount: ${tableCount}`);
        if (tableCount == 0) {
            logStr("Found 0 table entries");
            return -1;
        }
        VariableSizedImageData.minTableIndex = 0;
        VariableSizedImageData.maxTableIndex = tableCount - 1;
        VariableSizedImageData.maxImageIndex = DataParser.getLastImageIndex(VariableSizedImageData.maxImageIndex, VariableSizedImageData.maxTableIndex).last;
        if (VariableSizedImageData.maxImageIndex == -1) {
            logStr(`Error looking up max image index for last table index ${VariableSizedImageData.maxTableIndex}`);
            return -1;
        }
        VariableSizedImageData.minImageIndex = DataParser.getFirstImageIndex(VariableSizedImageData.minTableIndex);
        if (VariableSizedImageData.minImageIndex == -1) {
            logStr(`Error looking up min image index for first table index ${VariableSizedImageData.maxTableIndex})`);
            return -1;
        }
        logStr(`Determined maxTableIndex ${VariableSizedImageData.maxTableIndex}, maxImageIndex ${VariableSizedImageData.maxImageIndex}`);
        return 0;
    }
    static getVariableSizedImageTableMetadata(tableIndex) {
        const addr = DataParser.getROMAddressOfVariableSizedImageTable(tableIndex);
        if (addr === null) {
            return null;
        }
        if (addr >= ROM.size) {
            return null;
        }
        let ptr = addr;
        while ((ROM.byteAtAddr(ptr++) & 0xff) != 0x00)
            ;
        const height = ROM.byteAtAddr(ptr++);
        const spacing = ROM.byteAtAddr(ptr++);
        return { height, spacing };
    }
}

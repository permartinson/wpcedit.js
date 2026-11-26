import { HitTypes, DataTypes, WPC } from "../resources/Constants.js";
import { toHex, logStr } from "../resources/Helpers.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
import { ROM } from "../stores/ROM.js";

//
// WPC Games
// -----------------------------------------------------------------------
// Addams Family L5, H4
// Addams Family Gold H3
// Attack From Mars 1.13
// Black Rose L3
// Cactus Canyon 1.3              **8 MEG**
// Champion Pub 1.6
// Cirqus Voltaire 1.4            **8 MEG**
// Congo 2.1
// Corvette 2.1
// Creature from the black lagoon L4
// Demolition Man LX4
// Dirty Harry LX2
// Dracula L1
// Dr. Who L2
// Fish Tales L5
// Flintstones LX5
// Gilligans Island L9
// Getaway High Speed II L5
// Hurricane L2
// Indiana Jones L7
// Indianopolis 500 1.1R
// Jackbot 1.0R
// Johnny Mnemonic 1.2R
// Judge Dredd L7
// Junkyard 1.2
// Medievil Madness 1.09H         **8 MEG**
// Monster Bash 1.06
// NBA Fastbreak 3.1
// No Fear 2.3X
// No Good Gofers 1.3
// Popeye LX5
// Roadshow L6
// Safe Cracker 1.8G
// Scared Stiff 1.5
// Shadow LX6
// Slugfest L1
// Star Trek Next Generation L7
// Tales of the Arabian Nights 1.4
// Terminator 2 L8
// Theater of Magic 1.3
// Ticket Tac Toe 1.0
// Twilight Zone 9.4H
// White Water L5
// Who Dunnit 1.2
// World Cup Soccer LX2
//
//
// WPC, but no DMD!
// ----------------
// Dr. Dude
// Funhouse
// Harley Davidson
// League Champ
// Party Zone
// Strike Master
// The Machine Bride of Pinbot
//
//
//
//
/////////////////////////////////////////////////////////////////////////////


/** A WPC address (0x4000-0xFFFF) and the ROM page it is in (0xFF for non-banked ROM). */
export type WpcPointer = {
  addr: number;
  page: number;
};

/** Reads a 16-bit big-endian WPC address at a ROM position. */
function wordAt(pos: number) {
  return (((ROM.byteAtAddr(pos) & 0xff) << 8) | (ROM.byteAtAddr(pos + 1) & 0xff)) & 0xffff;
}

function isNonpagedAddr(addr: number) {
  return (
    addr >= WPC.BaseCodeAddrNonpagedRom &&
    addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength
  );
}

function isPagedAddr(addr: number) {
  return (
    addr >= WPC.BaseCodeAddrPagedRom &&
    addr < WPC.BaseCodeAddrPagedRom + WPC.PageLength
  );
}

export class DataParser {
  private static instance: DataParser;

  private constructor() {}

  public static init() {
    if (DataParser.instance) {
      return this.instance;
    }
    this.instance = new DataParser();
    return this.instance;
  }

  public static initTableAddrs(dataType: number) {
    // Example assembly for loading font table (IJ_L7):
    //-------------------------------------------------------------------------------------------------------------------------
    // D891: BE 82 A9    LDX   $82A9            ; X gets bytes from $82A9 Font Table pointer address
    // D894: 3A          ABX                    ;
    // D895: 58          ASLB                   ;
    // D896: 3A          ABX                    ; B was index of the font to use, so X pointed to font byte and 2 bytes that were put at $04EE
    // D897: D6 11       LDB   $11              ; B gets current ROM bank
    // D899: 34 04       PSHS  B                ; Save it
    // D89B: F6 82 AB    LDB   $82AB            ; B gets ROM bank of the font table
    // D89E: BD 8F FB    JSR   $8FFB            ; Set ROM bank to font table
    //-------------------------------------------------------------------------------------------------------------------------
    //
    // Some variations found among different ROMS:
    //
    // Search for: BE xx xx 3A 58 3A D6 yy 34 04 F6 zz zz BD ww ww, WPC Table address address is xxxx in non-banked ROM
    // Search for: BE xx xx 3A 58 3A D6 yy 34 04 BD zz zz BD ww ww, WPC Table address address is xxxx in non-banked ROM
    // Search for: BE xx xx 3A 58 3A D6 yy 34 04 BD zz zz F6 ww ww, WPC Table address address is xxxx in non-banked ROM
    // Search for: BE xx xx 3A 58 3A D6 yy 34 04 F6 zz zz F6 ww ww, WPC Table address address is xxxx in non-banked ROM
    //
    //
    // The above appears to successfully find the Font table pointer on all ROMs.
    // Following that appears to always be the Graphics table.
    // Following that appears to be the Animation table on some ROMs.
    //
    let ptr = 0;

    logStr(`Searching ROM for Master Animation Table Address`);

    for (let page = 0; page < ROM.totalPages; page++) {
      for (let pageByteIdx = 0; pageByteIdx < WPC.PageLength; pageByteIdx++) {
        if ((ROM.byteAtAddr(ptr++) & 0xff) != 0xbe) {
          continue;
        }
        //
        //             -1 +0 +1  2  3  4  5  6  7  8  9 10 11 12 13 14
        // Search for: BE xx xx 3A 58 3A D6 yy 34 04 F6 zz zz BD ww ww, WPC Table address address is xxxx in non-banked ROM
        // Search for: BE xx xx 3A 58 3A D6 yy 34 04 BD zz zz BD ww ww, WPC Table address address is xxxx in non-banked ROM
        // Search for: BE xx xx 3A 58 3A D6 yy 34 04 BD zz zz F6 ww ww, WPC Table address address is xxxx in non-banked ROM
        // Search for: BE xx xx 3A 58 3A D6 yy 34 04 F6 zz zz F6 ww ww, WPC Table address address is xxxx in non-banked ROM
        if (pageByteIdx >= WPC.PageLength - 16) {
          // don't try to read out of bounds, going to read up to 16 bytes after ptr
          continue;
        }
        if (
          !(
            (ROM.byteAtAddr(ptr + 2) & 0xff) == 0x3a &&
            (ROM.byteAtAddr(ptr + 3) & 0xff) == 0x58 &&
            (ROM.byteAtAddr(ptr + 4) & 0xff) == 0x3a &&
            (ROM.byteAtAddr(ptr + 5) & 0xff) == 0xd6 &&
            (ROM.byteAtAddr(ptr + 7) & 0xff) == 0x34 &&
            (ROM.byteAtAddr(ptr + 8) & 0xff) == 0x04 &&
            ((ROM.byteAtAddr(ptr + 9) & 0xff) == 0xf6 ||
              (ROM.byteAtAddr(ptr + 9) & 0xff) == 0xbd) &&
            ((ROM.byteAtAddr(ptr + 12) & 0xff) == 0xbd ||
              (ROM.byteAtAddr(ptr + 12) & 0xff) == 0xf6)
          )
        ) {
          continue;
        }

        //
        let hitTablePtr = ptr;
        let hitPagePtr = ptr + 2; // not used by HitTypes.AddrAddr, but setting to a known value here
        let romAddr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(hitTablePtr);
        if (romAddr === null) {
          logStr(
            `Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Font Table Pointer opcode: ${toHex(
              ROM.byteAtAddr(hitTablePtr)
            )} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`
          );
          return -1;
        }

        //
        logStr(`Address in ROM of Font Table Pointer ${toHex(romAddr)}`);

        if (dataType == DataTypes.FontData) {
          const fontTable = DataParser.processHitType(
            HitTypes.AddrAddr,
            hitTablePtr,
            hitPagePtr,
            ptr
          );
          VariableSizedImageData.tableAddress = fontTable ?? -1;
          if (fontTable === null) {
            logStr(
              `Error from ProcessHitType while trying to process Font Table Pointer opcode: ${toHex(
                ROM.byteAtAddr(hitTablePtr)
              )} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`
            );
            continue;
          }
          //
          logStr(
            `Found Address in ROM of Font Table ${toHex(
              VariableSizedImageData.tableAddress
            )}`
          );
        }

        // Now re-load Font table Addr Pointer and advance to Graphic Table....
        romAddr = DataParser.skipPointer(romAddr);

        //
        logStr(`Address in ROM of Graphics Table Pointer ${toHex(romAddr)}`);

        //
        hitTablePtr = romAddr;
        hitPagePtr = romAddr + 2; // in some cases when addr is in non-banked ROM this byte will get ignored

        //
        const graphicsTable = this.processHitType(
          HitTypes.Addr,
          hitTablePtr,
          hitPagePtr,
          ptr
        );
        FullFrameImageData.tableAddress = graphicsTable ?? -1;
        if (graphicsTable === null) {
          logStr(
            `Error from processHitType while trying to process Graphic Table Pointer: ${toHex(
              ROM.byteAtAddr(hitTablePtr)
            )} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`
          );
          if (dataType == DataTypes.FontData) {
            return 0; // just return, we found font addr but couldn't find graphic table, no big deal
          }
          return -1; // looking for graphics or animation table, some problem happened, return error
        }

        //
        logStr(
          `Found Address in ROM of Graphics Table ${toHex(
            FullFrameImageData.tableAddress
          )}`
        );

        if (dataType != DataTypes.AniData) {
          return 0; // found graphics table addr, no need to loop up animation table addr
        }

        // Now re-load Graphics table Addr Pointer and advance to Animation Table....
        romAddr = DataParser.skipPointer(romAddr);

        logStr(`Address in ROM of Animation Table Pointer ${toHex(romAddr)}`);

        //
        hitTablePtr = romAddr;
        hitPagePtr = romAddr + 2; // in some cases when addr is in non-banked ROM this byte will get ignored

        //
        const animationTable = this.processHitType(
          HitTypes.Addr,
          hitTablePtr,
          hitPagePtr,
          ptr
        );
        VariableSizedImageData.tableAddress = animationTable ?? -1;
        if (animationTable === null) {
          logStr(
            `Error from processHitType while trying to process Animation Table Pointer: ${toHex(
              ROM.byteAtAddr(hitTablePtr)
            )} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`
          );
          return -1; // looking for animation table, some problem happened, return error
        }
        //
        logStr(
          `Found Address in ROM of Animation Table ${toHex(
            VariableSizedImageData.tableAddress
          )}`
        );

        ROM.startPtr = ptr;

        return 0;
      }
    }
  }

  /**
   * Returns the ROM position after the table pointer at `pos`. The pointer
   * takes 2 bytes when it points into non-banked ROM and is not followed by
   * the 0xFF page byte, otherwise 3 bytes.
   */
  private static skipPointer(pos: number) {
    const wpcAddr = wordAt(pos);
    if (
      isNonpagedAddr(wpcAddr) &&
      (ROM.byteAtAddr(pos + 2) & 0xff) != WPC.NonpagedBankIndicator
    ) {
      return pos + 2; // PagePtr will end up pointing to invalid page but it will get fixed up to 0xff
    }
    return pos + 3;
  }

  public static getFirstImageIndex(tableIndex: number) {
    const imageIndex = this.getNextImageIndex(0, tableIndex);
    if (imageIndex == -1) {
      return -1;
    }
    VariableSizedImageData.currentImageIndex = imageIndex;
    return imageIndex;
  }

  public static getNextImageIndex(imageIndex: number, tableIndex: number) {
    // Standard validations and sanity checks
    if (!DataParser.isValidTableIndex(tableIndex)) {
      return -1;
    }

    const addr = this.getROMAddressOfVariableSizedImageTable(tableIndex);
    if (addr === null) {
      return -1;
    }

    // Get pointer to area in ROM of actual table
    let ptr = addr;
    while ((ROM.byteAtAddr(ptr) & 0xff) != 0x00) {
      const imageIndexMin = ROM.byteAtAddr(ptr++) & 0xff;
      const imageIndexMax = ROM.byteAtAddr(ptr++) & 0xff;
      //
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

  /**
   * Returns the last image index of a table, and a list of all its image
   * indexes. If the table has no images, `last` is the `imageIndex` passed in.
   */
  public static getLastImageIndex(
    imageIndex: number,
    tableIndex: number
  ): { last: number; indices: number[] } {
    const indices: number[] = [];
    let next = this.getNextImageIndex(0, tableIndex);
    while (next != -1) {
      imageIndex = next;
      indices.push(next);
      next = this.getNextImageIndex(next, tableIndex);
    }
    return { last: imageIndex, indices };
  }

  public static getPrevImageIndex(imageIndex: number, tableIndex: number) {
    // Standard validations and sanity checks
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

    // Get pointer to area in ROM of actual table
    let ptr = addr;
    // Need to start at last min/max pair and work down
    let windUp = 0;
    while ((ROM.byteAtAddr(ptr) & 0xff) != 0x00) {
      ptr += 2; // walk past the min/max pair
      windUp++;
    }

    // Now reverse back through the min/max pairs...
    while (windUp != 0) {
      ptr -= 2;
      windUp--;

      const imageIndexMin = ROM.byteAtAddr(ptr) & 0xff;
      const imageIndexMax = ROM.byteAtAddr(ptr + 1) & 0xff;

      //
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

  /** The standard validations and sanity checks on the font table address and a table index. */
  private static isValidTableIndex(tableIndex: number) {
    if (!VariableSizedImageData.tableAddress) {
      return false;
    }
    if (VariableSizedImageData.tableAddress >= ROM.size) {
      return false;
    }
    if (
      tableIndex < VariableSizedImageData.minTableIndex ||
      tableIndex > VariableSizedImageData.maxTableIndex
    ) {
      return false;
    }
    return true;
  }

  private static getROMAddressOfVariableSizedImageTable(tableIndex: number) {
    const pointer = this.extractWPCAddrAndPageOfImageTable(tableIndex);
    if (pointer === null) {
      return null;
    }
    return this.getROMAddressFromWPCAddrAndPage(pointer.addr, pointer.page);
  }

  public static extractWPCAddrAndPageOfImageTable(
    tableIndex: number
  ): WpcPointer | null {
    // Standard validations and sanity checks
    if (!DataParser.isValidTableIndex(tableIndex)) {
      return null;
    }

    let romAddr =
      DataParser.getAddrToWPCAddressOfVariableSizedImageTable(tableIndex);
    if (romAddr === null) {
      return null;
    }

    let addr = wordAt(romAddr);
    const page = ROM.byteAtAddr(romAddr + 2) & 0xff;

    {
      // Some ROMs have another pointer that needs de-referenced.  Instead of pointing to
      // the image table, its an address to the table within the same bank.  It appears
      // 0x00 follows the 2-byte address.
      romAddr = this.getROMAddressFromWPCAddrAndPage(addr, page);
      if (romAddr === null) {
        return null;
      }

      const tempAddr = wordAt(romAddr);
      const tempPage = ROM.byteAtAddr(romAddr + 2) & 0xff;

      logStr(`Testing Tempaddr ${toHex(tempAddr)} and Page ${toHex(tempPage)}`);

      if (isPagedAddr(tempAddr) /*&& (TempPage == 0x00)*/) {
        addr = tempAddr;
      }
      logStr(
        `extractWPCAddrAndPageOfImageTable() FIXUP, Addr fixed to ${toHex(
          addr
        )},${toHex(page)}`
      );
    }

    return { addr, page };
  }

  private static getROMAddressFromWPCAddrAndPage(addr: number, page: number) {
    // In  : The raw 16-bit address and 8-bit page from the WPC 3-byte address
    // Out : The 32-bit address in the ROM image corresponding to the WPC Addr and Page

    let romAddr: number;

    if (isNonpagedAddr(addr)) {
      if (page != WPC.NonpagedBankIndicator) {
        logStr(
          `getROMAddressFromWPCAddrAndPage() Non-banked WPC addr ${addr} followed by page byte ${page}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${WPC.NonpagedBankIndicator}`
        );
        page = WPC.NonpagedBankIndicator;
      }
    }

    if (page == WPC.NonpagedBankIndicator && isNonpagedAddr(addr)) {
      romAddr =
        (ROM.totalPages - 2) * WPC.PageLength +
        (addr - WPC.BaseCodeAddrNonpagedRom);
    } else if (
      page >= ROM.basePageIndex &&
      page < ROM.basePageIndex + ROM.totalPages - 2 &&
      addr >= WPC.BaseCodeAddrPagedRom &&
      addr < WPC.BaseCodeAddrNonpagedRom
    ) {
      romAddr =
        (page - ROM.basePageIndex) * WPC.PageLength +
        (addr - WPC.BaseCodeAddrPagedRom);
    } else {
      logStr(
        `Invalid WPC Addr and Page, ${toHex(addr)},${toHex(
          page
        )}, BasePage ${toHex(ROM.basePageIndex)}, TotalPages ${ROM.totalPages}`
      );
      return null;
    }
    if (romAddr >= ROM.size) {
      logStr(
        `Unexpected: Calculated addr in ROM ${romAddr} is greater than determined ROM size ${ROM.size}`
      );
      return null;
    }

    return romAddr;
  }

  private static getAddrToWPCAddressOfVariableSizedImageTable(
    tableIndex: number
  ) {
    // Standard validations and sanity checks
    if (!DataParser.isValidTableIndex(tableIndex)) {
      return null;
    }

    const romAddr = VariableSizedImageData.tableAddress + 3 * tableIndex;

    if (romAddr >= ROM.size) {
      return null;
    }

    return romAddr;
  }

  public static getROMAddressFromAddrOf3ByteWPCAddrPage(src: number) {
    // In  : Address of memory containg a 3-byte WPC Address notation
    // Out : Address in ROM image to which the WPC 3-byte address refers
    const pointer = DataParser.extractWPCAddrAndPageFromBuffer(src);
    if (pointer === null) {
      logStr(
        `Error from ExtractWPCAddrAndPageFromBuffer(), Passed it ptr to: ${
          ROM.byteAtAddr(src) & 0xff
        } ${ROM.byteAtAddr(src + 1) & 0xff} ${ROM.byteAtAddr(src + 2) & 0xff}`
      );
      return null;
    }
    return DataParser.getROMAddressFromWPCPointer(pointer);
  }

  /** Like getROMAddressFromAddrOf3ByteWPCAddrPage(), for a pointer that has already been read. */
  private static getROMAddressFromWPCPointer(pointer: WpcPointer) {
    logStr(
      `getROMAddressFromAddrOf3ByteWPCAddrPage() WPC TableAddress ${toHex(
        pointer.addr
      )},${toHex(pointer.page)}`
    );

    const romAddr = DataParser.getROMAddressFromWPCAddrAndPage(
      pointer.addr,
      pointer.page
    );
    if (romAddr === null) {
      logStr(
        `Error from getROMAddressFromWPCAddrAndPage(), Passed it WPC Addr ${pointer.addr},${pointer.page}`
      );
      return null;
    }

    logStr(
      `getROMAddressFromAddrOf3ByteWPCAddrPage() ROM TableAddress ${toHex(
        romAddr
      )}`
    );

    return romAddr;
  }

  public static getROMAddressOfVariableSizedImageIndex(
    tableIndex: number,
    imageIndex: number
  ) {
    let addr = DataParser.getROMAddressOfVariableSizedImageTable(tableIndex);
    if (addr === null) {
      return null;
    }

    // sanity check (maybe a bit redundant at this point)
    if (addr >= ROM.size) {
      return null;
    }

    // Get pointer to area in ROM of actual table
    let ptr = addr;
    let imageNum = 0;
    let imageFound = false;

    // Figure out which Nth image number this is in the table, there are min/max groups which cause gaps which we account for here
    while ((ROM.byteAtAddr(ptr) & 0xff) != 0x00) {
      let imageIndexMin = ROM.byteAtAddr(ptr++) & 0xff;
      const imageIndexMax = ROM.byteAtAddr(ptr++) & 0xff;

      //
      if (imageIndexMin > imageIndexMax) {
        return null;
      }
      if (!imageFound) {
        while (imageIndexMin <= imageIndexMax) {
          if (imageIndex <= imageIndexMin) {
            logStr(
              `getROMAddressOfVariableSizedImageIndex() ImageFound, ImageNum ${imageNum}, ImageIndexMin ${imageIndexMin}, ImageIndexMax ${imageIndexMax}`
            );
            imageFound = true;
            break;
          }
          imageNum++;
          imageIndexMin++;
        }
      }
    }

    //
    ptr++; // get past the 0x00 byte
    const tableHeight = ROM.byteAtAddr(ptr++);
    const tableSpacing = ROM.byteAtAddr(ptr++); // not sure at this point, 0x01 follows TableHeight

    // advance to desired image
    ptr += imageNum * 2;

    // Addr comes from pointer in table
    addr = wordAt(ptr);

    // Page is looked up from the current table index
    const pointer = DataParser.extractWPCAddrAndPageOfImageTable(tableIndex);
    if (pointer === null) {
      return null;
    }

    const romAddr = DataParser.getROMAddressFromWPCAddrAndPage(
      addr,
      pointer.page
    );
    if (romAddr === null) {
      return null;
    }

    //
    logStr(
      `getROMAddressOfVariableSizedImageIndex() TableHeight ${tableHeight}, TableSpacing ${tableSpacing} ImageIndex ${imageIndex} at ${romAddr}`
    );

    return romAddr;
  }

  private static extractWPCAddrAndPageFromBuffer(src: number) {
    // In  : Address of memory containg a 3-byte WPC Address notation
    // Out : The raw 16-bit address and 8-bit page from the WPC 3-byte address
    return DataParser.validateWPCPointer(
      wordAt(src),
      ROM.byteAtAddr(src + 2) & 0xff
    );
  }

  /** Checks that a WPC address and page make sense. Returns null if not. */
  private static validateWPCPointer(
    addr: number,
    page: number
  ): WpcPointer | null {
    if (isNonpagedAddr(addr)) {
      if (page != WPC.NonpagedBankIndicator) {
        logStr(
          `extractWPCAddrAndPageFromBuffer() Non-banked WPC addr ${toHex(
            addr
          )} followed by page byte ${toHex(
            page
          )}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${
            WPC.NonpagedBankIndicator
          }`
        );
        page = WPC.NonpagedBankIndicator;
      }
    }

    // Validate that the addr makes sense
    if (!isPagedAddr(addr) && !isNonpagedAddr(addr)) {
      logStr(`Expected a WPC Addr, but read ${toHex(addr)}`);
      return null;
    }
    // Validate that the page makes sense
    if (
      !(
        (page >= ROM.basePageIndex &&
          page < ROM.basePageIndex + ROM.totalPages) ||
        page == WPC.NonpagedBankIndicator
      )
    ) {
      logStr(
        `Expected a WPC Page Number, but read ${page}, Base is ${ROM.basePageIndex}, Total Pages ${ROM.totalPages}`
      );
      return null;
    }
    return { addr, page };
  }

  private static processHitType(
    hitType: number,
    hitTablePtr: number,
    hitPagePtr: number | null,
    ptr: number
  ): number | null {
    switch (hitType) {
      // this not used at this time...
      case HitTypes.AddrAddrAddr: {
        //
        logStr(
          `Potential Match. HitType ${toHex(
            ROM.byteAtAddr(ptr - 1) & 0xff
          )}, HitBytes ${toHex(ROM.byteAtAddr(hitTablePtr) & 0xff)} ${toHex(
            ROM.byteAtAddr(hitTablePtr + 1) & 0xff
          )}`
        );

        //
        const addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(hitTablePtr);
        if (addr === null) {
          logStr(
            `Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${toHex(
              ROM.byteAtAddr(hitTablePtr)
            )} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`
          );
          return null;
        }

        //
        logStr(
          `HitTypes.AddrAddrAddr derived ROM TableAddressAddress ${addr}, going to HitTypes.AddrAddr`
        );

        hitTablePtr = addr;
      }
      // falls through: now that we have the table address address, go to the following to get WPC address of the table, and then ROM address of the table

      case HitTypes.AddrAddr: {
        //
        logStr(
          `Potential Match. HitType ${toHex(
            ROM.byteAtAddr(ptr - 1) & 0xff
          )}, HitBytes ${toHex(ROM.byteAtAddr(hitTablePtr) & 0xff)} ${toHex(
            ROM.byteAtAddr(hitTablePtr + 1) & 0xff
          )}`
        );
        //
        const addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(hitTablePtr);
        if (addr === null) {
          logStr(
            `Error from GetROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${toHex(
              ROM.byteAtAddr(hitTablePtr)
            )} ${toHex(ROM.byteAtAddr(hitTablePtr + 1))}`
          );
          return null;
        }

        //
        logStr(
          `HitTypes.AddrAddr derived TableAddress of ${toHex(
            addr
          )} going to HitTypes.Addr`
        );

        hitTablePtr = addr;
        hitPagePtr = addr + 2; // in some cases when addr is in non-banked ROM this byte will get ignored
      }
      // falls through: now that we have the WPC table address, go to the following to get ROM address from WPC address

      case HitTypes.Addr: {
        //
        const hitAddr = wordAt(hitTablePtr);
        let hitPage: number;
        if (hitPagePtr === null) {
          // Null HitPagePtr is okay if the address is in non-paged ROM
          if (!isNonpagedAddr(hitAddr)) {
            logStr(
              `HitTypes.Addr, but HitPagePtr is NULL, and Addr is in paged ROM`
            );
            return null;
          }
          hitPage = WPC.NonpagedBankIndicator;
        } else {
          hitPage = ROM.byteAtAddr(hitPagePtr) & 0xff;
        }
        //
        logStr(
          `Potential Match. HitType ${toHex(
            ROM.byteAtAddr(ptr - 1) & 0xff
          )}, HitBytes ${toHex(hitAddr >> 8)} ${toHex(hitAddr & 0xff)} ${toHex(
            hitPage
          )}`
        );
        //
        const pointer = DataParser.validateWPCPointer(hitAddr, hitPage);
        const table =
          pointer === null ? null : DataParser.getROMAddressFromWPCPointer(pointer);
        if (table !== null) {
          logStr("Table Found!");
          return table;
        }
        //
        logStr(
          `Error deriving table addr from hit, HitType ${toHex(
            ROM.byteAtAddr(ptr - 1) & 0xff
          )}, HitBytes ${toHex(hitAddr >> 8)} ${toHex(hitAddr & 0xff)} ${toHex(
            hitPage
          )}. Will keep looking. May need to debug by opening window while pressing <shift>`
        );
        return null;
      }

      case HitTypes.None:
        return 0;

      default:
        logStr("Unexpected HitType");
        return null;
    }
  }

  public static preAnalyzeVariableSizedImageTable() {
    let tableCount = 0;
    ROM.vSImageTableMap.length = 0; // Reset the index map

    // Standard validations and sanity checks
    if (!VariableSizedImageData.tableAddress) {
      logStr(`Unexpected NULL ${VariableSizedImageData.tableAddress}`);
    }
    if (VariableSizedImageData.tableAddress >= ROM.size) {
      logStr(
        `Unexpected table address ${VariableSizedImageData.tableAddress} is >= ${ROM.size}`
      );
    }

    let ptr = VariableSizedImageData.tableAddress;

    // We're now at the start of the table, lets count up the number table entries
    while (DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(ptr) !== null) {
      VariableSizedImageData.maxTableIndex++;
      const result = DataParser.getLastImageIndex(
        -1,
        VariableSizedImageData.maxTableIndex - 1
      );
      // Add the index to a table so we can fetch the data later without having to parse the entire rom again
      ROM.vSImageTableMap.push(result.indices);
      ptr += 3;
      tableCount++;
      if (result.last == -1) {
        VariableSizedImageData.maxTableIndex--;
        logStr(
          `Stopped looking for image tables due to getLastImageIndex() error on TableIndex ${VariableSizedImageData.maxTableIndex}`
        );
        break;
      }
    }

    logStr(`Determined TableCount: ${tableCount}`);

    if (tableCount == 0) {
      logStr("Found 0 table entries");
      return -1;
    }

    // Last 0-based, valid, image table index
    VariableSizedImageData.minTableIndex = 0;
    VariableSizedImageData.maxTableIndex = tableCount - 1;

    //
    VariableSizedImageData.maxImageIndex = DataParser.getLastImageIndex(
      VariableSizedImageData.maxImageIndex,
      VariableSizedImageData.maxTableIndex
    ).last;
    if (VariableSizedImageData.maxImageIndex == -1) {
      logStr(
        `Error looking up max image index for last table index ${VariableSizedImageData.maxTableIndex}`
      );
      return -1;
    }

    //
    VariableSizedImageData.minImageIndex = DataParser.getFirstImageIndex(
      VariableSizedImageData.minTableIndex
    );
    if (VariableSizedImageData.minImageIndex == -1) {
      logStr(
        `Error looking up min image index for first table index ${VariableSizedImageData.maxTableIndex})`
      );
      return -1;
    }

    //
    logStr(
      `Determined maxTableIndex ${VariableSizedImageData.maxTableIndex}, maxImageIndex ${VariableSizedImageData.maxImageIndex}`
    );

    return 0;
  }

  public static getVariableSizedImageTableMetadata(tableIndex: number) {
    const addr = DataParser.getROMAddressOfVariableSizedImageTable(tableIndex);
    if (addr === null) {
      return null;
    }

    // sanity check (maybe a bit redundant at this point)
    if (addr >= ROM.size) {
      return null;
    }

    // Get pointer to area in ROM of actual table
    let ptr = addr;

    // Past the 0x00
    while ((ROM.byteAtAddr(ptr++) & 0xff) != 0x00);
    const height = ROM.byteAtAddr(ptr++);
    const spacing = ROM.byteAtAddr(ptr++); // not sure at this point, 0x01 follows TableHeight
    return { height, spacing };
  }
}

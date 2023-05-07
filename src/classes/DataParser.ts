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

export class DataParser {
  private static instance: DataParser;

  private constructor() {}

  public static init(romData: Uint8Array) {
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
    let Page: number;
    let PageByteIdx: number;
    let HitTablePtr: number;
    let HitPagePtr: number;
    let RomAddr: number;
    let WpcAddr: number;
    let Ptr = 0;

    logStr(`Searching ROM for Master Animation Table Address`);

    for (Page = 0; Page < ROM.totalPages; Page++) {
      for (PageByteIdx = 0; PageByteIdx < WPC.PageLength; PageByteIdx++) {
        switch (ROM.byteAtAddr(Ptr++) & 0xff) {
          case 0xbe:
            //
            //             -1 +0 +1  2  3  4  5  6  7  8  9 10 11 12 13 14
            // Search for: BE xx xx 3A 58 3A D6 yy 34 04 F6 zz zz BD ww ww, WPC Table address address is xxxx in non-banked ROM
            // Search for: BE xx xx 3A 58 3A D6 yy 34 04 BD zz zz BD ww ww, WPC Table address address is xxxx in non-banked ROM
            // Search for: BE xx xx 3A 58 3A D6 yy 34 04 BD zz zz F6 ww ww, WPC Table address address is xxxx in non-banked ROM
            // Search for: BE xx xx 3A 58 3A D6 yy 34 04 F6 zz zz F6 ww ww, WPC Table address address is xxxx in non-banked ROM
            if (PageByteIdx >= WPC.PageLength - 16) {
              // don't try to read out of bounds, going to read up to 16 bytes after Ptr
              break;
              //return -1;
            }
            if (
              (ROM.byteAtAddr(Ptr + 2) & 0xff) == 0x3a &&
              (ROM.byteAtAddr(Ptr + 3) & 0xff) == 0x58 &&
              (ROM.byteAtAddr(Ptr + 4) & 0xff) == 0x3a &&
              (ROM.byteAtAddr(Ptr + 5) & 0xff) == 0xd6 &&
              (ROM.byteAtAddr(Ptr + 7) & 0xff) == 0x34 &&
              (ROM.byteAtAddr(Ptr + 8) & 0xff) == 0x04 &&
              ((ROM.byteAtAddr(Ptr + 9) & 0xff) == 0xf6 ||
                (ROM.byteAtAddr(Ptr + 9) & 0xff) == 0xbd) &&
              ((ROM.byteAtAddr(Ptr + 12) & 0xff) == 0xbd ||
                (ROM.byteAtAddr(Ptr + 12) & 0xff) == 0xf6)
            ) {
              //
              HitTablePtr = Ptr;
              HitPagePtr = Ptr + 2; // not used by HitTypes.AddrAddr, but setting to a known value here
              RomAddr =
                DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitTablePtr);
              if (RomAddr == -1) {
                logStr(
                  `Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Font Table Pointer opcode: ${toHex(
                    HitTablePtr & 0xff
                  )} ${toHex((HitTablePtr + 1) & 0xff)}`
                );
                return -1;
              }

              //
              logStr(`Address in ROM of Font Table Pointer ${toHex(RomAddr)}`);

              if (dataType == DataTypes.FontData) {
                VariableSizedImageData.TableAddress = DataParser.processHitType(
                  HitTypes.AddrAddr,
                  HitTablePtr,
                  HitPagePtr,
                  Ptr
                );
                if (VariableSizedImageData.TableAddress == -1) {
                  logStr(
                    `Error from ProcessHitType while trying to process Font Table Pointer opcode: ${toHex(
                      HitTablePtr & 0xff
                    )} ${toHex((HitTablePtr + 1) & 0xff)}`
                  );
                  break;
                }
                //
                logStr(
                  `Found Address in ROM of Font Table ${toHex(
                    VariableSizedImageData.TableAddress
                  )}`
                );
              }

              // Now re-load Font table Addr Pointer and advance to Graphic Table....
              HitTablePtr = RomAddr;
              HitPagePtr = RomAddr + 2; // in some cases when addr is in non-banked ROM this byte will get ignored
              WpcAddr =
                ((ROM.byteAtAddr(HitTablePtr & 0xff) << 8) +
                  (ROM.byteAtAddr(HitTablePtr + 1)) & 0xff) &
                0xffff;
              if (
                WpcAddr >= WPC.BaseCodeAddrNonpagedRom &&
                WpcAddr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength &&
                ROM.byteAtAddr(HitPagePtr & 0xff) != WPC.NonpagedBankIndicator
              ) {
                RomAddr += 2; // PagePtr will end up pointing to invalid page but it will get fixed up to 0xff
              } else {
                RomAddr += 3;
              }

              //
              logStr(
                `Address in ROM of Graphics Table Pointer ${toHex(RomAddr)}`
              );

              //
              HitTablePtr = RomAddr;
              HitPagePtr = RomAddr + 2; // in some cases when addr is in non-banked ROM this byte will get ignored

              //
              FullFrameImageData.TableAddress = this.processHitType(
                HitTypes.Addr,
                HitTablePtr,
                HitPagePtr,
                Ptr
              );
              if (FullFrameImageData.TableAddress == -1) {
                logStr(
                  `Error from processHitType while trying to process Graphic Table Pointer: ${toHex(
                    HitTablePtr & 0xff
                  )} ${toHex((HitTablePtr + 1) & 0xff)}`
                );
                if (dataType == DataTypes.FontData) {
                  return 0; // just return, we found font addr but couldn't find graphic table, no big deal
                }
                return -1; // looking for graphics or animation table, some problem happened, return error
              }

              //
              logStr(
                `Found Address in ROM of Graphics Table ${toHex(
                  FullFrameImageData.TableAddress
                )}`
              );

              if (dataType != DataTypes.AniData) {
                return 0; // found graphics table addr, no need to loop up animation table addr
              }

              // Now re-load Graphics table Addr Pointer and advance to Animation Table....
              HitTablePtr = ROM.byteAtAddr(RomAddr);
              HitPagePtr = ROM.byteAtAddr(RomAddr + 2); // in some cases when addr is in non-banked ROM this byte will get ignored
              WpcAddr =
                ((ROM.byteAtAddr(HitTablePtr & 0xff) << 8) +
                  (ROM.byteAtAddr(HitTablePtr + 1) & 0xff)) &
                0xffff;
              if (
                WpcAddr >= WPC.BaseCodeAddrNonpagedRom &&
                WpcAddr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength &&
                ROM.byteAtAddr(HitPagePtr & 0xff) != WPC.NonpagedBankIndicator
              ) {
                RomAddr += 2; // PagePtr will end up pointing to invalid page but it will get fixed up to 0xff
              } else {
                RomAddr += 3;
              }

              logStr(
                `Address in ROM of Animation Table Pointer ${toHex(RomAddr)}`
              );

              //
              HitTablePtr = ROM.byteAtAddr(RomAddr);
              HitPagePtr = ROM.byteAtAddr(RomAddr + 2); // in some cases when addr is in non-banked ROM this byte will get ignored

              //
              VariableSizedImageData.TableAddress = this.processHitType(
                HitTypes.Addr,
                HitTablePtr,
                HitPagePtr,
                Ptr
              );
              if (VariableSizedImageData.TableAddress == -1) {
                logStr(
                  `Error from processHitType while trying to process Animation Table Pointer: ${
                    HitTablePtr & 0xff
                  } ${(HitTablePtr + 1) & 0xff}`
                );
                return -1; // looking for animation table, some problem happened, return error
              }
              //
              logStr(
                `Found Address in ROM of Animation Table ${toHex(
                  VariableSizedImageData.TableAddress
                )}`
              );

              ROM.startPtr = Ptr;

              return 0;
            }
            break;
          default:
            break;
        }
      }
    }
    //}
    //return -1;
  }

  public static getFirstImageIndex(TableIndex: number) {
    const imageIndex = this.getNextImageIndex(0, TableIndex);
    if (imageIndex == -1) {
      return -1;
    }
    VariableSizedImageData.CurrentImageIndex = imageIndex;
    return imageIndex;
  }

  public static getNextImageIndex(pImageIndex: number, TableIndex: number) {
    let Addr: number;
    let Ptr: number;
    let ImageIndexMin: number;
    let ImageIndexMax: number;

    // Standard validations and sanity checks
    if (!VariableSizedImageData.TableAddress) {
      return -1;
    }
    if (VariableSizedImageData.TableAddress >= ROM.size) {
      return -1;
    }
    if (
      TableIndex < VariableSizedImageData.minTableIndex ||
      TableIndex > VariableSizedImageData.maxTableIndex
    ) {
      return -1;
    }

    Addr = this.getROMAddressOfVariableSizedImageTable(TableIndex);
    if (Addr == -1) {
      return -1;
    }

    // Get pointer to area in ROM of actual table
    Ptr = Addr;
    while ((ROM.byteAtAddr(Ptr) & 0xff) != 0x00) {
      ImageIndexMin = ROM.byteAtAddr(Ptr++) & 0xff;
      ImageIndexMax = ROM.byteAtAddr(Ptr++) & 0xff;
      //
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

  public static getLastImageIndex(
    pImageIndex: number,
    TableIndex: number
  ): [number, number[]] {
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

  public static getPrevImageIndex(pImageIndex: number, TableIndex: number) {
    let Addr: number;
    let Ptr: number;
    let ImageIndexMin: number;
    let ImageIndexMax: number;
    let windUp: number;

    // Standard validations and sanity checks
    if (!VariableSizedImageData.TableAddress) {
      return -1;
    }
    if (VariableSizedImageData.TableAddress >= ROM.size) {
      return -1;
    }
    if (
      TableIndex < VariableSizedImageData.minTableIndex ||
      TableIndex > VariableSizedImageData.maxTableIndex
    ) {
      return -1;
    }
    if (pImageIndex == null) {
      return -1;
    }

    Addr = this.getROMAddressOfVariableSizedImageTable(TableIndex);
    if (Addr == -1) {
      return -1;
    }

    // Get pointer to area in ROM of actual table
    Ptr = Addr;
    // Need to start at last min/max pair and work down
    windUp = 0;
    while ((ROM.byteAtAddr(Ptr) & 0xff) != 0x00) {
      Ptr += 2; // walk past the min/max pair
      windUp++;
    }

    // Now reverse back through the min/max pairs...
    while (windUp != 0) {
      Ptr -= 2;
      windUp--;

      ImageIndexMin = ROM.byteAtAddr(Ptr) & 0xff;
      ImageIndexMax = ROM.byteAtAddr(Ptr + 1) & 0xff;

      //
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

  private static getROMAddressOfVariableSizedImageTable(TableIndex: number) {
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

  public static extractWPCAddrAndPageOfImageTable(TableIndex: number) {
    let romAddr: number;
    let Ptr: number;
    let Addr: number;
    let Page: number;

    // Standard validations and sanity checks
    if (!VariableSizedImageData.TableAddress) {
      return [-1, -1];
    }
    if (VariableSizedImageData.TableAddress >= ROM.size) {
      return [-1, -1];
    }
    if (
      VariableSizedImageData.CurrentTableIndex <
        VariableSizedImageData.minTableIndex ||
      VariableSizedImageData.CurrentTableIndex >
        VariableSizedImageData.maxTableIndex
    ) {
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
      // Some ROMs have another pointer that needs de-referenced.  Instead of pointing to
      // the image table, its an address to the table within the same bank.  It appears
      // 0x00 follows the 2-byte address.
      let TempAddr: number;
      let TempPage: number;

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

      if (
        TempAddr >= WPC.BaseCodeAddrPagedRom &&
        TempAddr < WPC.BaseCodeAddrPagedRom + WPC.PageLength
        /*&& (TempPage == 0x00)*/
      ) {
        Addr = TempAddr;
      }
      logStr(
        `extractWPCAddrAndPageOfImageTable() FIXUP, Addr fixed to ${toHex(
          Addr
        )},${toHex(Page)}`
      );
    }

    return [Addr, Page];
  }

  private static getROMAddressFromWPCAddrAndPage(Addr: number, Page: number) {
    // In  : The raw 16-bit address and 8-bit page from the WPC 3-byte address
    // Out : The 32-bit address in the ROM image corresponding to the WPC Addr and Page

    let romAddr: number;

    if (
      Addr >= WPC.BaseCodeAddrNonpagedRom &&
      Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength
    ) {
      if (Page != WPC.NonpagedBankIndicator) {
        logStr(
          `getROMAddressFromWPCAddrAndPage() Non-banked WPC addr ${Addr} followed by page byte ${Page}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${WPC.NonpagedBankIndicator}`
        );
        Page = WPC.NonpagedBankIndicator;
      }
    }

    if (
      Page == WPC.NonpagedBankIndicator &&
      Addr >= WPC.BaseCodeAddrNonpagedRom &&
      Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength
    ) {
      romAddr =
        (ROM.totalPages - 2) * WPC.PageLength +
        (Addr - WPC.BaseCodeAddrNonpagedRom);
    } else if (
      Page >= ROM.basePageIndex &&
      Page < ROM.basePageIndex + ROM.totalPages - 2 &&
      Addr >= WPC.BaseCodeAddrPagedRom &&
      Addr < WPC.BaseCodeAddrNonpagedRom
    ) {
      romAddr =
        (Page - ROM.basePageIndex) * WPC.PageLength +
        (Addr - WPC.BaseCodeAddrPagedRom);
    } else {
      logStr(
        `Invalid WPC Addr and Page, ${toHex(Addr)},${toHex(
          Page
        )}, BasePage ${toHex(ROM.basePageIndex)}, TotalPages ${ROM.totalPages}`
      );
      return -1;
    }
    if (romAddr >= ROM.size) {
      logStr(
        `Unexpected: Calculated addr in ROM ${romAddr} is greater than determined ROM size ${ROM.size}`
      );
      return -1;
    }

    return romAddr;
  }

  private static getAddrToWPCAddressOfVariableSizedImageTable(
    TableIndex: number
  ) {
    let romAddr: number;

    // Standard validations and sanity checks
    if (!VariableSizedImageData.TableAddress) {
      return -1;
    }
    if (VariableSizedImageData.TableAddress >= ROM.size) {
      return -1;
    }
    if (
      TableIndex < VariableSizedImageData.minTableIndex ||
      TableIndex > VariableSizedImageData.maxTableIndex
    ) {
      return -1;
    }

    romAddr = VariableSizedImageData.TableAddress + 3 * TableIndex;

    if (romAddr >= ROM.size) {
      return -1;
    }

    return romAddr;
  }

  public static getROMAddressFromAddrOf3ByteWPCAddrPage(pSrc: number) {
    // In  : Address of memory containg a 3-byte WPC Address notation
    // Out : Address in ROM image to which the WPC 3-byte address refers
    let Addr: number;
    let Page: number;

    const result = DataParser.extractWPCAddrAndPageFromBuffer(pSrc);
    Addr = result[0];
    Page = result[1];
    if (Addr == -1) {
      logStr(
        `Error from ExtractWPCAddrAndPageFromBuffer(), Passed it ptr to: ${
          ROM.byteAtAddr(pSrc) & 0xff
        } ${ROM.byteAtAddr(pSrc + 1) & 0xff} ${ROM.byteAtAddr(pSrc + 2) & 0xff}`
      );
      return -1;
    }

    logStr(
      `getROMAddressFromAddrOf3ByteWPCAddrPage() WPC TableAddress ${toHex(
        Addr
      )},${toHex(Page)}`
    );

    Addr = DataParser.getROMAddressFromWPCAddrAndPage(Addr, Page);
    if (Addr == -1) {
      logStr(
        `Error from getROMAddressFromWPCAddrAndPage(), Passed it WPC Addr ${Addr},${Page}`
      );
      return -1;
    }

    logStr(
      `getROMAddressFromAddrOf3ByteWPCAddrPage() ROM TableAddress ${toHex(
        Addr
      )}`
    );

    return Addr;
  }

  public static getROMAddressOfVariableSizedImageIndex(
    TableIndex: number,
    ImageIndex: number
  ) {
    let Addr: number;
    let Page: number;
    let Ptr: number;
    let TableHeight: number;
    let TableSpacing: number; // not sure at this point, 0x01 follows TableHeight
    let ImageIndexMin: number,
      ImageIndexMax: number,
      ImageNum: number,
      ImageFound: number;

    //logStr(`getROMAddressOfVariableSizedImageIndex() Looking up ROM addres for TableIndex ${TableIndex}, ImageIndex ${ImageIndex}`);

    Addr = DataParser.getROMAddressOfVariableSizedImageTable(TableIndex);
    if (Addr == -1) {
      return -1;
    }

    // sanity check (maybe a bit redundant at this point)
    if (Addr >= ROM.size) {
      return -1;
    }

    // Get pointer to area in ROM of actual table
    Ptr = Addr;
    ImageNum = ImageFound = 0;

    // Figure out which Nth image number this is in the table, there are min/max groups which cause gaps which we account for here
    while ((ROM.byteAtAddr(Ptr) & 0xff) != 0x00) {
      ImageIndexMin = ROM.byteAtAddr(Ptr++) & 0xff;
      ImageIndexMax = ROM.byteAtAddr(Ptr++) & 0xff;
      //logStr(`getROMAddressOfVariableSizedImageIndex() ImageIndexMin ${ImageIndexMin} ImageIndexMax ${ImageIndexMax}`);

      //
      if (ImageIndexMin > ImageIndexMax) {
        return -1;
      }
      if (ImageFound == 0) {
        while (ImageIndexMin <= ImageIndexMax) {
          if (ImageIndex <= ImageIndexMin) {
            logStr(
              `getROMAddressOfVariableSizedImageIndex() ImageFound, ImageNum ${ImageNum}, ImageIndexMin ${ImageIndexMin}, ImageIndexMax ${ImageIndexMax}`
            );
            ImageFound = 1;
            break;
          }
          ImageNum++;
          ImageIndexMin++;
        }
      }
    }

    //
    Ptr++; // get past the 0x00 byte
    TableHeight = ROM.byteAtAddr(Ptr++);
    TableSpacing = ROM.byteAtAddr(Ptr++);

    //
    //logStr(`getROMAddressOfVariableSizedImageIndex() TableHeight ${TableHeight}, TableSpacing ${TableSpacing}`);

    // advance to desired image
    Ptr += ImageNum * 2;

    // Addr comes from pointer in table
    Addr = ROM.byteAtAddr(Ptr) & 0xff;
    Addr = Addr << 8;
    Addr |= ROM.byteAtAddr(Ptr + 1) & 0xff;
    Addr &= 0xffff;

    // Page is looked up from the current table index
    const result = DataParser.extractWPCAddrAndPageOfImageTable(TableIndex);
    Page = result[1];
    if (Page == -1) {
      return -1;
    }

    Addr = DataParser.getROMAddressFromWPCAddrAndPage(Addr, Page);
    if (Addr == -1) {
      return -1;
    }

    //
    logStr(
      `getROMAddressOfVariableSizedImageIndex() TableHeight ${TableHeight}, TableSpacing ${TableSpacing} ImageIndex ${ImageIndex} at ${Addr}`
    );

    return Addr;
  }

  private static extractWPCAddrAndPageFromBuffer(pSrc: number) {
    // In  : Address of memory containg a 3-byte WPC Address notation
    // Out : The raw 16-bit address and 8-bit page from the WPC 3-byte address
    let Addr: number;
    let Page: number;
    Addr = ROM.byteAtAddr(pSrc) & 0xff;
    Addr = Addr << 8;
    Addr = Addr | (ROM.byteAtAddr(pSrc + 1) & 0xff);
    Addr = Addr & 0xffff;
    Page = ROM.byteAtAddr(pSrc + 2) & 0xff;
    if (
      Addr >= WPC.BaseCodeAddrNonpagedRom &&
      Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength
    ) {
      if (Page != WPC.NonpagedBankIndicator) {
        logStr(
          `extractWPCAddrAndPageFromBuffer() Non-banked WPC addr ${toHex(
            Addr
          )} followed by page byte ${toHex(
            Page
          )}, normal when reading from opcode or some ROMs with 2-byte table addr entries. Forcing page to ${
            WPC.NonpagedBankIndicator
          }`
        );
        Page = WPC.NonpagedBankIndicator;
      }
    }

    if (Addr != null) {
      // Caller wants addr, validate it makes sense first
      if (
        (Addr >= WPC.BaseCodeAddrPagedRom &&
          Addr < WPC.BaseCodeAddrPagedRom + WPC.PageLength) ||
        (Addr >= WPC.BaseCodeAddrNonpagedRom &&
          Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength)
      ) {
      } else {
        logStr(`Expected a WPC Addr, but read ${toHex(Addr)}`);
        return [-1, -1];
      }
    }
    if (Page != null) {
      // Caller wants page, validate it makes sense first
      if (
        (Page >= ROM.basePageIndex &&
          Page < ROM.basePageIndex + ROM.totalPages) ||
        Page == WPC.NonpagedBankIndicator
      ) {
      } else {
        logStr(
          `Expected a WPC Page Number, but read ${Page}, Base is ${ROM.basePageIndex}, Total Pages ${ROM.totalPages}`
        );
        return [-1, -1];
      }
    }
    return [Addr, Page];
  }

  private static processHitType(
    HitType: number,
    HitTablePtr: number,
    HitPagePtr: number,
    Ptr: number
  ) {
    let Addr: number;
    let HitBuf = [0, 0, 0];
    let pTbl: number;

    switch (HitType) {
      // this not used at this time...
      case HitTypes.AddrAddrAddr:
        //
        logStr(
          `Potential Match. HitType ${toHex(
            ROM.byteAtAddr(Ptr - 1) & 0xff
          )}, HitBytes ${toHex(ROM.byteAtAddr(HitTablePtr) & 0xff)} ${toHex(
            ROM.byteAtAddr(HitTablePtr + 1) & 0xff
          )}`
        );

        //
        Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitTablePtr);
        if (Addr == -1) {
          logStr(
            `Error from getROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${
              HitTablePtr & 0xff
            } ${(HitTablePtr + 1) & 0xff}`
          );
          return -1;
        }

        //
        logStr(
          `HitTypes.AddrAddrAddr derived ROM TableAddressAddress ${Addr}, going to HitTypes.AddrAddr`
        );

        HitTablePtr = ROM.byteAtAddr(Addr);
      // no break!  now that we have the table address address, go to the following to get WPC address of the table, and then ROM address of the table

      case HitTypes.AddrAddr:
        //
        logStr(
          `Potential Match. HitType ${toHex(
            ROM.byteAtAddr(Ptr - 1) & 0xff
          )}, HitBytes ${toHex(ROM.byteAtAddr(HitTablePtr) & 0xff)} ${toHex(
            ROM.byteAtAddr(HitTablePtr + 1) & 0xff
          )}`
        );
        //
        Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitTablePtr);
        if (Addr == -1) {
          logStr(
            `Error from GetROMAddressFromAddrOf3ByteWPCAddrPage(), Passed it WPC Ptr to ${
              HitTablePtr & 0xff
            } ${(HitTablePtr + 1) & 0xff}`
          );
          return -1;
        }

        //
        logStr(
          `HitTypes.AddrAddr derived TableAddress of ${toHex(
            Addr
          )} going to HitTypes.Addr`
        );

        HitTablePtr = Addr;
        HitPagePtr = Addr + 2; // in some cases when addr is in non-banked ROM this byte will get ignored
      // no break!  now that we have the WPC table address, go to the following to get ROM address from WPC address

      case HitTypes.Addr:
        //
        if (HitTablePtr == null) {
          logStr("HitTypes.Addr, but HitTablePtr is NULL");
          return -1;
        }
        //

        HitBuf[0] = HitTablePtr; // & 0xff;
        HitBuf[1] = HitTablePtr + 1; // & 0xff;
        if (HitPagePtr == null) {
          // Null HitPagePtr is okay if the address is in non-paged ROM
          let Addr;

          Addr = HitBuf[0] & 0xff;
          Addr = Addr << 8;
          Addr = Addr | (HitBuf[1] & 0xff);
          Addr = Addr & 0xffff;

          if (
            !(
              Addr >= WPC.BaseCodeAddrNonpagedRom &&
              Addr < WPC.BaseCodeAddrNonpagedRom + WPC.NonpagedLength
            )
          ) {
            logStr(
              `HitTypes.Addr, but HitPagePtr is NULL, and Addr is in paged ROM`
            );
            return -1;
          }

          HitBuf[2] = WPC.NonpagedBankIndicator;
        } else {
          HitBuf[2] = ROM.byteAtAddr(HitPagePtr);
        }
        /*
#if 0
//debug force particular table addr
HitBuf[0] = 0x40;
HitBuf[1] = 0x39;
HitBuf[2] = 0x30;
#endif
*/
        //
        logStr(
          `Potential Match. HitType ${toHex(
            ROM.byteAtAddr(Ptr - 1) & 0xff
          )}, HitBytes ${toHex(ROM.byteAtAddr(HitBuf[0]) & 0xff)} ${toHex(
            ROM.byteAtAddr(HitBuf[1]) & 0xff
          )} ${toHex(HitBuf[2] & 0xff)}`
        );
        //
        pTbl = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(HitBuf[0]);
        if (pTbl != -1) {
          logStr("Table Found!");
          return pTbl;
        }
        //
        logStr(
          `Error deriving table addr from hit, HitType ${
            (Ptr - 1) & 0xff
          }, HitBytes ${HitBuf[0] & 0xff} ${HitBuf[1] & 0xff} ${
            HitBuf[2] & 0xff
          }. Will keep looking. May need to debug by opening window while pressing <shift>`
        );
        break;

      case HitTypes.None:
        return 0;

      default:
        logStr("Unexpected HitType");
        break;
    }
    return -1;
  }

  public static preAnalyzeVariableSizedImageTable() {
    let Ptr: number;
    let Addr: number;
    let TableCount = 0;
    ROM.vSImageTableMap.length = 0; // Reset the index map

    // Standard validations and sanity checks
    if (!VariableSizedImageData.TableAddress) {
      logStr(`Unexpected NULL ${VariableSizedImageData.TableAddress}`);
    }
    if (VariableSizedImageData.TableAddress >= ROM.size) {
      logStr(
        `Unexpected table address ${VariableSizedImageData.TableAddress} is >= ${ROM.size}`
      );
    }

    Ptr = VariableSizedImageData.TableAddress;

    // We're now at the start of the table, lets count up the number table entries
    let continueLooping = true;
    while (continueLooping) {
      Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(Ptr);
      if (Addr == -1) {
        continueLooping = false;
      } else {
        VariableSizedImageData.maxTableIndex++;
        const result = DataParser.getLastImageIndex(
          -1,
          VariableSizedImageData.maxTableIndex - 1
        );
        const ImageIndex = result[0];
        // Add the index to a table so we can fetch the data later without having to parse the entire rom again
        ROM.vSImageTableMap.push(result[1]); //[VariableSizedImageData.maxTableIndex-1].push(ImageIndex);
        if (ImageIndex == -1) {
          VariableSizedImageData.maxTableIndex--;
          logStr(
            `Stopped looking for image tables due to getLastImageIndex() error on TableIndex ${VariableSizedImageData.maxTableIndex}`
          );
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

    // Last 0-based, valid, image table index
    VariableSizedImageData.minTableIndex = 0;
    VariableSizedImageData.maxTableIndex = TableCount - 1;

    // Backup to the last valid image table, for purposes of debug message/validation
    //logStr(`Last Table: ${(ROM.byteAtAddr(Ptr-3))&0xFF} ${(ROM.byteAtAddr((Ptr-2)))&0xFF} ${(ROM.byteAtAddr((Ptr-1)))&0xFF}, ROM Addr ${Addr}`);

    //
    VariableSizedImageData.maxImageIndex = DataParser.getLastImageIndex(
      VariableSizedImageData.maxImageIndex,
      VariableSizedImageData.maxTableIndex
    )[0];
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
    if (VariableSizedImageData.minTableIndex == -1) {
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

  public static getVariableSizedImageTableMetadata(TableIndex: number) {
    let Addr: number;
    let Ptr: number;
    let TableHeight: number;
    let TableSpacing: number; // not sure at this point, 0x01 follows TableHeight

    Addr = DataParser.getROMAddressOfVariableSizedImageTable(TableIndex);
    if (Addr == -1) {
      return [-1, -1];
    }

    // sanity check (maybe a bit redundant at this point)
    if (Addr >= ROM.size) {
      return [-1, -1];
    }

    // Get pointer to area in ROM of actual table
    Ptr = Addr;

    // Past the 0x00
    while ((ROM.byteAtAddr(Ptr++) & 0xff) != 0x00);
    TableHeight = ROM.byteAtAddr(Ptr++);
    TableSpacing = ROM.byteAtAddr(Ptr++);
    return [TableHeight, TableSpacing];
  }
}

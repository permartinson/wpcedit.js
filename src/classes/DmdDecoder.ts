import * as Defines from "../resources/Defines";
import {
  WriteTypes,
  ImageCodes,
  DataTypes,
  PlaneStatuses,
  WPC,
} from "../resources/Constants.js";
import { DataParser } from "./DataParser.js";
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

export class DmdDecoder {
  private PreviousPlaneDataPane0 = new Uint8Array();
  private PreviousPlaneDataPane1 = new Uint8Array();

  constructor() {}

  public init() {}

  public static decodeNextIndex(count: number, dataType: number) {
    switch (dataType) {
      case DataTypes.Graphics:
        while (count--) {
          //if (FullFrameImageData.CurrentImageIndex < MAX_GRAPHIC_INDEX)
          {
            FullFrameImageData.CurrentImageIndex++;
          }
        }
        break;

      case DataTypes.FontData:
      case DataTypes.AniData:
        //
        if (
          VariableSizedImageData.Planes.Plane0.Plane_Status ==
          PlaneStatuses.Valid
        ) {
          if (
            VariableSizedImageData.CurrentImageXShift + WPC.DmdCols <
            VariableSizedImageData.CurrentImageXSize
          ) {
            VariableSizedImageData.CurrentImageXShift +=
              WPC.ImageShiftXPixelCount * count;
            break;
          }
          if (
            VariableSizedImageData.CurrentImageYShift + WPC.DmdRows <
            VariableSizedImageData.CurrentImageYSize
          ) {
            VariableSizedImageData.CurrentImageYShift +=
              WPC.ImageShiftYPixelCount * count;
            break;
          }
        }
        VariableSizedImageData.CurrentImageXShift = -1;
        VariableSizedImageData.CurrentImageYShift = -1;
        //
        while (count--) {
          const result = DmdDecoder.incrementVariableSizedImageIndex(
            VariableSizedImageData.CurrentTableIndex,
            VariableSizedImageData.CurrentImageIndex
          );
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

  private static incrementVariableSizedImageIndex(
    pTableIndex: number,
    pImageIndex: number
  ) {
    let tmpImageIndex: number;

    if (pTableIndex == null || pImageIndex == null) {
      return [-1, -1];
    }

    //
    tmpImageIndex = DataParser.getLastImageIndex(pImageIndex, pTableIndex)[0];
    if (tmpImageIndex == -1) {
      return [-1, -1];
    }

    //
    if ((pImageIndex & 0xff) < (tmpImageIndex & 0xff)) {
      //
      pImageIndex = DataParser.getNextImageIndex(pImageIndex, pTableIndex);
      if (pImageIndex == -1) {
        return [-1, -1];
      }

      return [pTableIndex, pImageIndex];
    }

    if (pTableIndex < VariableSizedImageData.maxTableIndex) {
      //
      pTableIndex++;
      //
      pImageIndex = DataParser.getFirstImageIndex(pTableIndex);
      if (pImageIndex == -1) {
        return [-1, -1];
      }
      return [pTableIndex, pImageIndex];
    }

    // else we must be at last indexes, do nothing, just return 0, no errors.
    return [0, 0];
  }

  private static decrementVariableSizedImageIndex(
    pTableIndex: number,
    pImageIndex: number
  ) {
    let tmpImageIndex: number;

    if (pTableIndex == null || pImageIndex == null) {
      return [-1, -1];
    }

    //
    tmpImageIndex = DataParser.getFirstImageIndex(pTableIndex);
    if (tmpImageIndex == -1) {
      return [-1, -1];
    }

    //
    if ((pImageIndex & 0xff) > (tmpImageIndex & 0xff)) {
      //
      pImageIndex = DataParser.getPrevImageIndex(pImageIndex, pTableIndex);
      if (pImageIndex == -1) {
        return [-1, -1];
      }
      return [pTableIndex, pImageIndex];
    }
    if (pTableIndex > VariableSizedImageData.minTableIndex) {
      //
      pTableIndex = pTableIndex - 1;

      //

      if (DataParser.getLastImageIndex(pImageIndex, pTableIndex)[0] != 0) {
        return [-1, -1];
      }
      return [pTableIndex, pImageIndex];
    }

    // else we must be at first indexes, do nothing, just return 0, no errors.
    return [pTableIndex, pImageIndex];
  }

  public static decodePreviousIndex(count: number, dataType: number) {
    switch (dataType) {
      case DataTypes.Graphics:
        while (count-- && FullFrameImageData.CurrentImageIndex) {
          FullFrameImageData.CurrentImageIndex--;
        }
        break;

      case DataTypes.FontData:
      case DataTypes.AniData:
        //
        if (
          VariableSizedImageData.Planes.Plane0.Plane_Status ==
          PlaneStatuses.Valid
        ) {
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
        //
        while (count--) {
          const result = DmdDecoder.decrementVariableSizedImageIndex(
            VariableSizedImageData.CurrentTableIndex,
            VariableSizedImageData.CurrentImageIndex
          );
          VariableSizedImageData.CurrentTableIndex = result[0];
          VariableSizedImageData.CurrentImageIndex = result[1];
          if (result[0] == -1) {
            //logStr("Unexpected error decrementing image indexes");
          }
        }
        break;

      default:
        break;
    }

    //
    //DecodeCurrentIndex();
    //InvalidateDMDPages();
  }

  public static decodeFullFrameGraphic(GraphicIndex: number) {
    FullFrameImageData.Planes.Plane0 = this.decodeImageToPlane(GraphicIndex);
    FullFrameImageData.Planes.Plane1 = this.decodeImageToPlane(
      GraphicIndex + 1
    );
  }

  public static decodeVariableSizedImageData() {
    const result = DmdDecoder.decodeVariableSizedImageIndexToPlane(
      VariableSizedImageData.CurrentTableIndex,
      VariableSizedImageData.CurrentImageIndex
    );
    VariableSizedImageData.Planes = result[1];

    // If error then force any stale offset values to 0

    if (
      VariableSizedImageData.Planes.Plane0.Plane_Status != PlaneStatuses.Valid
    ) {
      VariableSizedImageData.CurrentImageXSize = 0;
      VariableSizedImageData.CurrentImageYSize = 0;
      VariableSizedImageData.CurrentImageXShift = 0;
      VariableSizedImageData.CurrentImageYShift = 0;
    }
  }

  public static decodeVariableSizedImageIndexToPlane(
    TableIndex: number,
    ImageIndex: number
  ): [number, Defines.DMDPlanes] {
    let DataPtr: number;
    let Addr: number;

    let pPlanes: Defines.DMDPlanes = {
      Plane0: DmdDecoder.decodePlaneInit(),
      Plane1: DmdDecoder.decodePlaneInit(),
    };

    //
    VariableSizedImageData.CurrentImageXSize = 0;
    VariableSizedImageData.CurrentImageYSize = 0;

    Addr = DataParser.getROMAddressOfVariableSizedImageIndex(
      TableIndex,
      ImageIndex
    );
    VariableSizedImageData.Address = Addr;

    if (Addr == -1) {
      pPlanes.Plane0.Plane_Status = PlaneStatuses.BadDimension;
      pPlanes.Plane1.Plane_Status = PlaneStatuses.BadDimension;
      return [-1, pPlanes];
    }
    DataPtr = Addr;

    pPlanes = DmdDecoder.decodeVariableSizedImage(
      DataPtr,
      pPlanes,
      TableIndex
    )[1];
    return [0, pPlanes];
  }

  private static decodeVariableSizedImage(
    Source: number,
    pPlanes: Defines.DMDPlanes,
    TableIndex: number
  ): [number, Defines.DMDPlanes] {
    let TableHeight: number;
    let TableSpacing: number;
    VariableSizedImageData.Address = Source;

    let ch = ROM.byteAtAddr(Source);

    const result = DataParser.getVariableSizedImageTableMetadata(TableIndex);
    TableHeight = result[0];
    TableSpacing = result[1];
    if (TableHeight == -1) {
      logStr(
        `Unexpected problem looking up TableIndex ${TableIndex} height & spacing`
      );
      return [-1, pPlanes];
    }
    if (ch > 0 && ch <= WPC.DmdCols) {
      pPlanes = DmdDecoder.decodeVariableSizedImageIndex_NoHeader(
        Source,
        pPlanes,
        TableHeight
      );
    } else {
      switch (ch) {
        case ImageCodes.Monochrome: // 0x00, Typical header
        case ImageCodes.BicolorIndirect: // Special header, bi-color image with pointer to other plane (IJ)
        case ImageCodes.BicolorDirect: // Special header, bi-color image with other plane included
        case ImageCodes.FD: // Unusre, but draws fine with 0x00 header processing (possibly inversed paint?)
          break;
        default:
          logStr(`Unrecognized Header Byte ${ch}`);
          break;
      }
      pPlanes = DmdDecoder.decodeVariableSizedImageIndex_Header(
        Source,
        pPlanes,
        TableHeight,
        TableIndex
      );
    }
    return [0, pPlanes];
  }

  private static decodeVariableSizedImageToBits(
    SourcePtr: number,
    Dest: Uint8Array,
    ImageHeight: number,
    ImageWidth: number,
    Centered = false
  ): [number, Uint8Array, number] {
    let ch: number;
    let WriteCounter = 0;
    let i, j: number;
    let DestPtr = 0;
    //ImageWidth = Math.ceil(ImageWidth/8)*8;

    Dest = new Uint8Array(
      Math.ceil(Math.ceil(ImageWidth / 8) * 8 * ImageHeight) / 8
    );

    if (SourcePtr >= ROM.endPtr) {
      return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
    }

    //

    if (VariableSizedImageData.CurrentImageYShift == -1) {
      VariableSizedImageData.CurrentImageYShift = 0;
      while (
        WPC.DmdRows + VariableSizedImageData.CurrentImageYShift <
        ImageHeight
      ) {
        VariableSizedImageData.CurrentImageYShift += WPC.ImageShiftYPixelCount;
      }
    }
    //
    if (VariableSizedImageData.CurrentImageXShift == -1) {
      VariableSizedImageData.CurrentImageXShift = 0;
      while (
        WPC.DmdCols + VariableSizedImageData.CurrentImageXShift <
        ImageWidth
      ) {
        VariableSizedImageData.CurrentImageXShift += WPC.ImageShiftXPixelCount;
      }
    }
    // Soak up SourcePtr bytes to account for Y shift
    for (i = 0; i < VariableSizedImageData.CurrentImageYShift; i++) {
      for (j = 0; j < (ImageWidth + 7) / 8; j++) {
        if (SourcePtr++ >= ROM.endPtr) {
          return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
        }
      }
    }

    //
    for (i = 0; i < ImageHeight && WriteCounter < Dest.length; i++) {
      // Now write actual image pixel bytes
      for (j = 0; j < Math.floor((ImageWidth + 7) / 8); j++) {
        ch = ROM.byteAtAddr(SourcePtr);

        if (SourcePtr++ >= ROM.endPtr) {
          return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
        }
        if (
          j >=
            Math.floor((VariableSizedImageData.CurrentImageXShift + 7) / 8) &&
          j <
            Math.floor(
              ImageWidth + VariableSizedImageData.CurrentImageXShift + 7
            ) /
              8
        ) {
          const result = this.writeNext8BitValueAnySize(
            WriteCounter,
            Dest,
            DestPtr,
            ch,
            WriteTypes.Rows,
            ImageWidth,
            ImageHeight
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
        }
      }
    }

    // Soak up SourcePtr bytes to finish reading entire bitmap for oversized images that use 0xFF encoding, $SourcePtr will be sitting at next plane
    for (
      i = 0;
      i <
      ImageHeight - (WPC.DmdRows + VariableSizedImageData.CurrentImageYShift);
      i++
    ) {
      for (j = 0; j < (ImageWidth + 7) / 8; j++) {
        if (SourcePtr++ >= ROM.endPtr) {
          return [PlaneStatuses.ImageOutOfRange, Dest, SourcePtr];
        }
      }
    }

    //
    VariableSizedImageData.CurrentImageXSize = ImageWidth;
    VariableSizedImageData.CurrentImageYSize = ImageHeight;

    return [PlaneStatuses.Valid, Dest, SourcePtr];
  }

  private static decodeVariableSizedImageIndex_NoHeader(
    SourcePtr: number,
    pPlanes: Defines.DMDPlanes,
    TableHeight: number
  ) {
    let DestPlane0 = pPlanes.Plane0.Plane_Data;
    let DestPlane1 = pPlanes.Plane1.Plane_Data; // unused?
    let ImageWidth: number;

    //
    pPlanes.Plane0.Plane_Status = PlaneStatuses.Invalid;
    pPlanes.Plane1.Plane_Status = PlaneStatuses.Invalid;

    // Note, ->Plane_Size not shown for VariableSizedImageData display.
    pPlanes.Plane0.Plane_Size = 0;
    pPlanes.Plane1.Plane_Size = 0;

    //

    ImageWidth = ROM.byteAtAddr(SourcePtr);
    if (SourcePtr++ >= ROM.endPtr) {
      logStr(
        `Address is out of bounds in decodeVariableSizedImageIndex_NoHeader()`
      );
      return pPlanes;
    }

    //
    //logStr(`decodeVariableSizedImageIndex_NoHeader(), TableHeight ${TableHeight}, ImageWidth ${ImageWidth}`);
    const result = this.decodeVariableSizedImageToBits(
      SourcePtr,
      DestPlane0,
      TableHeight,
      ImageWidth
    );
    pPlanes.Plane0.Plane_Status = result[0];
    pPlanes.Plane0.Plane_Data = result[1];
    SourcePtr = result[2];
    return pPlanes;
  }

  private static decodeVariableSizedImageIndex_Header(
    SourcePtr: number,
    pPlanes: Defines.DMDPlanes,
    TableHeight: number,
    TableIndex: number
  ) {
    let DestPlane0 = pPlanes.Plane0.Plane_Data;
    let DestPlane1 = pPlanes.Plane1.Plane_Data;
    let HeaderByte: number;
    let VerticalOffset: number;
    let HorizontalOffset: number;
    let ImageHeight: number;
    let ImageWidth: number;

    //
    pPlanes.Plane0.Plane_Status = PlaneStatuses.Invalid;
    pPlanes.Plane1.Plane_Status = PlaneStatuses.Invalid;

    // Note, ->Plane_Size not shown for VariableSizedImageData display.
    pPlanes.Plane0.Plane_Size = 0;
    pPlanes.Plane0.Plane_Size = 0;

    pPlanes.Plane0.Address = SourcePtr;
    pPlanes.Plane1.Address = SourcePtr;

    //
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

    //logStr(`decodeVariableSizedImageIndex_Header(), HeaderByte ${HeaderByte}, TableHeight ${TableHeight}, VertOffset ${VerticalOffset}, HorizOffset ${HorizontalOffset}, ImageHeight ${ImageHeight}, ImageWidth ${ImageWidth}`);
    //
    switch (HeaderByte) {
      case ImageCodes.BicolorDirect:
        const result1 = this.decodeVariableSizedImageToBits(
          SourcePtr,
          DestPlane1,
          ImageHeight,
          ImageWidth
        );
        pPlanes.Plane1.Plane_Status = result1[0];
        pPlanes.Plane1.Plane_Data = result1[1];
        const result0 = this.decodeVariableSizedImageToBits(
          SourcePtr,
          DestPlane0,
          ImageHeight,
          ImageWidth
        );
        pPlanes.Plane0.Plane_Status = result0[0];
        pPlanes.Plane0.Plane_Data = result0[1];
        break;

      case ImageCodes.BicolorIndirect:
        {
          let Page: number;
          let TmpBuf = [0, 0, 0];
          let Addr: number;
          let pBiColor: number;

          const result =
            DataParser.extractWPCAddrAndPageOfImageTable(TableIndex);
          Addr = result[0];
          Page = result[1];
          if (Addr == -1) {
            logStr(
              `decodeVariableSizedImageIndex_Header(), Unexpected problem looking up TableIndex ${TableIndex} WPC Page`
            );
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
            logStr(
              `decodeVariableSizedImageIndex_Header(), Unexpected problem looking up ROM address of bi-color plane from 3-byte WPC Addr ${
                TmpBuf[0] & 0xff
              } ${TmpBuf[1] & 0xff} ${TmpBuf[2] & 0xff}`
            );
            return pPlanes;
          }

          pBiColor = ROM.byteAtAddr(Addr);

          //
          const result1 = this.decodeVariableSizedImageToBits(
            pBiColor,
            DestPlane1,
            ImageHeight,
            ImageWidth
          );
          pPlanes.Plane1.Plane_Status = result1[0];
          pPlanes.Plane1.Plane_Data = result1[1];

          const result0 = this.decodeVariableSizedImageToBits(
            SourcePtr,
            DestPlane0,
            ImageHeight,
            ImageWidth
          );
          pPlanes.Plane0.Plane_Status = result0[0];
          pPlanes.Plane0.Plane_Data = result0[1];
        }
        break;

      case ImageCodes.FD:

      default:
        const result = this.decodeVariableSizedImageToBits(
          SourcePtr,
          DestPlane0,
          ImageHeight,
          ImageWidth
        );
        pPlanes.Plane0.Plane_Status = result[0];
        pPlanes.Plane0.Plane_Data = result[1];
        break;
    }
    return pPlanes;
  }

  public static getImageEncoding(Index: number) {
    const pPlane = this.decodeImageToPlane(Index);
    return pPlane.Plane_Encoding;
  }

  private static decodeImageToPlane(Index: number, SkipDecoding = false) {
    let pPlane: Uint8Array;
    let OriginalDataPtr: number;
    let DataPtr: number;
    let Addr: number;

    let DMDPlane: Defines.DMDPlane;
    DMDPlane = DmdDecoder.decodePlaneInit();

    //logStr(`Graphic Index ${Index} Plane ${Plane}`);

    //
    DMDPlane.Table_Address = FullFrameImageData.TableAddress;

    // Each graphic table entry is 3 bytes long
    Addr = FullFrameImageData.TableAddress + Index * 3;

    if (Addr >= ROM.size) {
      DMDPlane.Plane_Status = PlaneStatuses.TableEntryOutOfRange;
      return DMDPlane;
    }
    Addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(Addr);
    if (Addr == -1) {
      logStr(
        `decodeImageToPlane() got error from GetROMAddressFromAddrOf3ByteWPCAddrPage()`
      );
      DMDPlane.Plane_Status = PlaneStatuses.TableEntryOutOfRange;
      return DMDPlane;
    }

    if (Addr >= ROM.size) {
      DMDPlane.Plane_Status = PlaneStatuses.TableEntryOutOfRange;
      return DMDPlane;
    }

    OriginalDataPtr = DataPtr = Addr;
    DMDPlane = this.decodeFullFrameGraphicImage(Addr, DMDPlane, SkipDecoding);
    //DMDPlane.Plane_Status = this.decodeFullFrameGraphicImage(&DataPtr, DMDPlane);
    DMDPlane.Plane_Size = DataPtr - OriginalDataPtr; // this does not work because the pointer is no pointer! must be moved further into the process

    return DMDPlane;
  }

  private static decodePlaneInit() {
    let Plane = new Uint8Array(WPC.DmdPageBytes);
    //
    // We'll clear out the page of data bytes here..
    //
    let pPlane: Defines.DMDPlane = {
      Plane_Size: 0,
      Plane_Data: Plane,
      Plane_Skipped: Plane,
      Plane_XorFlags: Plane,
      Plane_XorBits: Plane,
      Plane_Status: PlaneStatuses.Valid, // Assume the image will be valid unless otherwise determined
      Plane_Encoding: 255,
      Address: 0,
      Table_Address: 0,
    };

    return pPlane;
  }

  private static decodeFullFrameGraphicImage(
    Source: number,
    pPlane: Defines.DMDPlane,
    SkipDecoding: boolean
  ) {
    let OriginalDataPtr = Source;

    let Dest = new Uint8Array(pPlane.Plane_Data);

    let ch = ROM.byteAtAddr(Source);
    pPlane.Plane_Encoding = ch & 0x0f;
    pPlane.Address = Source;

    if (SkipDecoding) {
      // If we just want to get the type, let's skip all the decoding.
      return pPlane;
    }

    Source++;
    if (Source >= ROM.endPtr) {
      pPlane.Plane_Status = PlaneStatuses.ImageOutOfRange;
      return pPlane;
    }

    //
    logStr(`Type ${toHex(ch)}`);

    switch (ch & 0x0f) {
      case 0x00: //  Raw 32 bytes by 16 byes copy, no encodings.
        Dest = this.decode_00(Source);
        pPlane.Plane_Data = Dest;
        return pPlane;
      case 0x01: //  Simple Repeats, Columns
        Dest = this.decode_01(Source);
        pPlane.Plane_Data = Dest;
        return pPlane;
      case 0x02: //  Simple Repeats, Rows
        Dest = this.decode_02(Source);
        pPlane.Plane_Data = Dest;
        return pPlane;
      case 0x03: //  <unsure>
        Dest = this.decode_03(Source);
        pPlane.Plane_Status = PlaneStatuses.Unimplemented;
        return pPlane; // this is a cheat but we know that type 03 is not being decoded
      case 0x04: //  Complex Repeats, 9-byte header, Columns
        Dest = this.decode_04(Source);
        pPlane.Plane_Data = Dest;
        return pPlane;
      case 0x05: //  Complex Repeats, 9-byte header, Rows
        Dest = this.decode_05(Source);
        pPlane.Plane_Data = Dest;
        return pPlane;
      case 0x06: //  XOR-Repeat, Columns
        const result_06 = this.decode_06(Source); // return skipped and xor also
        pPlane.Plane_Data = result_06[0];
        pPlane.Plane_XorFlags = result_06[1];
        pPlane.Plane_XorBits = result_06[2];
        return pPlane;
      case 0x07: //  XOR-Repeat, Rows
        const result_07 = this.decode_07(Source); // return skipped and xor also
        pPlane.Plane_Data = result_07[0];
        pPlane.Plane_XorFlags = result_07[1];
        pPlane.Plane_XorBits = result_07[2];
        return pPlane;
      case 0x08: //  Bulk Skips and Bulk Repeats, Columns
        const result_08 = this.decode_08(Source); // return skipped also
        pPlane.Plane_Data = result_08[0];
        pPlane.Plane_Skipped = result_08[1];
        return pPlane;
        break;
      case 0x09: //  Bulk Skips and Bulk Repeats, Rows
        const result_09 = this.decode_09(Source); // return skipped also
        pPlane.Plane_Data = result_09[0];
        pPlane.Plane_Skipped = result_09[1];
        return pPlane;
      case 0x0a: //  Write Data Bytes or Multiple Skips, Columns
        const result_0A = this.decode_0A(Source); // return skipped also
        pPlane.Plane_Data = result_0A[0];
        pPlane.Plane_Skipped = result_0A[1];
        return pPlane;
      case 0x0b: //  Write Data Bytes or Multiple Skips, Rows
        const result_0B = this.decode_0B(Source); // return skipped also
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

  private static decode_00(Source: number) {
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

  //  Simple Repeats, Columns
  private static decode_01(Source: number) {
    // IMAGE TYPE 0x04 or 0x01                ; EDF1h   Byte1 = Byte AFTER the 0x04
    //
    // Simple Repeats, Columns
    //
    // Format:
    //  0x02                   Image type byte, byte that got us this far.
    //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
    //   <data starts here>
    //
    // This is a simple encoding very similar to IMAGE TYPE 0x05 or 0x02.  This
    // encoding uses a simple single-special-byte at the top and whenever this
    // byte is encountered, the following 2 bytes are used for Repeat/Data so that
    // the Data is repeated for the number of times in 'Repeat'.
    //
    // The only difference between this and IMAGE TYPE 0x05 or 0x02 is that this
    // encoding method writes in columns from LEFT to RIGHT starting at the top
    // left and ending at the bottom right of the DMD.
    //
    return this.decode_01or02(Source, WriteTypes.Columns);
  }

  private static decode_02(Source: number) {
    // IMAGE TYPE 0x05 or 0x02                ; EE70h
    //
    // Simple Repeats, Rows
    //
    // Format:
    //  0x02                   Image type byte, byte that got us this far.
    //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
    //   <data starts here>
    //
    // This is a very basic encoding that allows for repeats 8-bit patterns that
    // might occur frequently.  This writes the DMD from the TOP to the BOTTOM,
    // starting at the top left and ending at the bottom right.  As with all
    // encodings, the data actually appears in reverse at every 8-bit column on the
    // DMD, for example if the first 2 data bytes are A0B0, the top row, left side
    // of the DMD will illuminate the pixels like: .....0.0 ....00.0
    // (0 is on pixel, . is off pixel)
    //
    // The bytes are read from the data and written to the DMD memory (again, in
    // ROWS on the DMD from top to bottom).  When a byte is found that matches the
    // byte defined as <Special Flag Byte> then instead of writing the byte to the
    // DMD, the following 2 bytes are read, making up the following format:
    //
    // <Special Flag Byte> <Length> <Pattern>
    //
    // The 8-bits defined in <Pattern> are written to the DMD for the number of times
    // defined in <Length>.
    //
    // If the actual byte defined in <Special Flag Byte> needs to be drawn on the DMD
    // then a <Length> byte of 1 can be used with the <Pattern> byte matching the
    // <Special Flag Byte>.  The length should not be 0, if the length is zero, then
    // the pattern will end up being repeated 256 times.
    //
    return this.decode_01or02(Source, WriteTypes.Rows);
  }

  private static decode_01or02(SourcePtr: number, Type: number) {
    let DestPtr = 0;
    let Dest = new Uint8Array(WPC.DmdPageBytes);
    let ch: number;
    let SpecialFlagByte: number;
    let WriteCounter: number;

    SpecialFlagByte = ROM.byteAtAddr(SourcePtr);
    SourcePtr++;
    if (SourcePtr >= ROM.endPtr) {
      return Dest;
    }
    WriteCounter = 0; // Stores bytes we've written to DMD Ram
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
          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            Value2,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
        } while (--Value1 && WriteCounter < WPC.DmdPageBytes);
      } else {
        const result = DmdDecoder.writeNext8BitValue(
          WriteCounter,
          Dest,
          DestPtr,
          ch,
          Type
        );
        DestPtr = result[0];
        Dest = result[1];
        WriteCounter = result[2];
      }
    } while (WriteCounter < WPC.DmdPageBytes);
    return Dest;
  }

  //  <unsure>
  private static decode_03(Source: number) {
    return new Uint8Array();
  }

  private static decode_04(Source: number) {
    //  IMAGE TYPE 0x07 or 0x04      ; Byte1 = byte AFTER bitmap type
    //
    // Complex Repeats, 9-byte header, Columns
    //
    // Format:
    //  0x04                   Image type byte, byte that got us this far.
    //   <Special Flag Byte>   Special 8-bit value that is used to signal special encodings.
    //   <Special Byte 1>      Special #1  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 2>      Special #2  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 3>      Special #3  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 4>      Special #4  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 5>      Special #5  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 6>      Special #6  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 7>      Special #7  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 8>      Special #8  Can be used for repeat counts or for actual bitmap data.
    //    <data starts here>
    //
    //   All bits drawn on the dot matrix display for this image type are drawn
    //   in COLUMNS starting at the top of the left most 8-bit column and ending
    //   at the bottom of the right-most 8-bit column.  It should be noted that the
    //   bits are also mirror-reversed for every of the 16 8-bit columns.  For
    //   example when the first byte of display memory contains a value of 0xC0 the
    //   top left corner of the dot matrix display will show ......OO where 'O' is
    //   an illuminated pixel and '.' is an off pixel.
    //
    //   Data Format:  Continuous stream of bits, starting at 0x80 bit of the first
    //                 byte and continuing until all 32x128 dots are accounted for.
    //                 This continuous stream of bits opeates in the following
    //                 manner...
    //
    //   When '0' bit is encountered, the following 8 bits are drawn on the dot
    //   matrix directly (no special encoding).  When '1' extension bit is
    //   encountered, the number of continuous 1s that follow is counted up
    //   (until a zero trailing bit is encountered and consumed).  Note that the
    //   maximum number of continuous 1s to follow the extension bit is 7, this
    //   means there is NO trailing 0 bit that is consumed after 7 continuous 1s.
    //   After 7 continuous 1s after the extension bit, the next command is
    //   processed (ie if 0 then draw next 8 bits, if 1 process another extension
    //   bit set).  The number of continuous 1s that follow the extension bit
    //   cause the following to occur...
    //
    //   # of 1s following extension bit                    Effect
    //   ----------------------------------------------------------------------------
    //                0                      Draw 8 bits defined in <Special Byte 1>, or special repeat encoding, see below,
    //                1                      Draw 8 bits defined in <Special Byte 2>, or special repeat encoding, see below,
    //                2                      Draw 8 bits defined in <Special Byte 3>, or special repeat encoding, see below,
    //                3                      Draw 8 bits defined in <Special Byte 4>, or special repeat encoding, see below,
    //                4                      Draw 8 bits defined in <Special Byte 5>, or special repeat encoding, see below,
    //                5                      Draw 8 bits defined in <Special Byte 6>, or special repeat encoding, see below,
    //                6                      Draw 8 bits defined in <Special Byte 7>, or special repeat encoding, see below,
    //                7                      Draw 8 bits defined in <Special Byte 8>, or special repeat encoding, see below,
    //
    //   <special repeat encoding>
    //   If the <Special Byte X> byte matches the 8-bit value <Special Flag Byte>
    //   (at top of graphic header) then those 8-bits defined in the special byte
    //   will NOT be drawn, instead the bit stream is read for the next TWO VALUES.
    //   The next two values that are pulled from the bit stream can be encoded by
    //   referencing the Special Byte (using extension bit followed by appropriate
    //   number of continuous 1s) or the next two values can be pulled from the bit
    //   stream using non-extended method (a 0-bit followed by 8 bits representing
    //   the value.  The next 2 values that are pulled from the bit stream can also
    //   be encoded using any combination of the previously mentioned encoded
    //   methods.  Typically the first of the 2 values is encoded using the
    //   extension-bit method and usually the 2nd of the 2 values is also encoded
    //   using the extension bit method, although it is not uncommon to see the
    //   2nd of the 2 values be a direct encoded value (0 bit followed by the
    //   desired 8-bit value.
    //
    //   The next 2 values that follow are used in the following manner:
    //     <Value1>  This is the first value read after the Special Flag Byte match occurs.
    //     <Value2>  This is the second value read after the Special Flag Byte match occurs.
    //
    //   The 8-bit value defined by <Value2> is repeated for the number of times
    //   defined by <Value1>.
    //
    //
    //struct ImageHeader
    //{
    //	unsigned char SpecialFlagByte;
    //	unsigned char RepeatBytes[8];
    //	unsigned char ReadMask;
    //};
    return this.decode_04or05(Source, WriteTypes.Columns);
  }

  private static decode_05(Source: number) {
    // Complex Repeats, 9-byte header, Rows
    //
    // Format:
    //  0x04                   Image type byte, byte that got us this far.
    //   <Special Flag Byte>   Special 8-bit value that is used to signal special encodings.
    //   <Special Byte 1>      Special #1  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 2>      Special #2  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 3>      Special #3  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 4>      Special #4  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 5>      Special #5  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 6>      Special #6  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 7>      Special #7  Can be used for repeat counts or for actual bitmap data.
    //   <Special Byte 8>      Special #8  Can be used for repeat counts or for actual bitmap data.
    //    <data starts here>
    //
    // This is exactly the same as IMAGE TYPE 0x07 or 0x04 except data is written
    // on the DMD ram in ROWS from top-left to bottom-right.  This takes less code
    // space because there is no special code to decrement DMD ram to get the pointer
    // to the top of the next column.  See image type 0x07 or 0x04 below for details.
    //
    return this.decode_04or05(Source, WriteTypes.Rows);
  }

  private static decode_04or05(SourcePtr: number, Type: number) {
    let Dest = new Uint8Array(WPC.DmdPageBytes);
    let DestPtr = 0;
    let Header: Defines.ImageHeader = {
      ReadMask: 0x80,
      RepeatBytes: [0, 0, 0, 0, 0, 0, 0, 0],
      SpecialFlagByte: ROM.byteAtAddr(SourcePtr),
    };
    let ch: number;
    let i: number;
    let WriteCounter: number;

    WriteCounter = 0; // Stores bytes we've written to DMD Ram

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
          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            Value2,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
        } while (--Value1 && WriteCounter < WPC.DmdPageBytes);
      } else {
        const result = DmdDecoder.writeNext8BitValue(
          WriteCounter,
          Dest,
          DestPtr,
          ch,
          Type
        );
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

  private static decode_06(Source: number) {
    // IMAGE TYPE 0x09 or 0x06                ; ECE6h
    //
    // XOR-Repeat, Columns
    //
    // Format:
    //  0x02                   Image type byte, byte that got us this far.
    //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
    //   <data starts here>
    //
    // This encoding is identical to IMAGE TYPE 0x0A or 0x07 except the data is
    // drawn to DMD ram in COLUMNS from LEFT to RIGHT starting at the top left of
    // the DMD and ending at the bottom right.
    //
    return this.decode_06or07(Source, WriteTypes.Columns);
  }

  private static decode_07(Source: number) {
    // IMAGE TYPE 0x0A or 0x07                ; ED80h
    //
    // XOR-Repeat, Rows
    //
    // Format:
    //  0x02                   Image type byte, byte that got us this far.
    //   <Special Flag Byte>   Special 8-bit value that is used to signal repeats
    //   <data starts here>
    //
    // Special XOR encoding.  This encoding scheme writes to the DMD in ROWS from
    // the TOP to BOTTOM of the DMD starting at the top-left and ending at the
    // bottom right of the display.
    //
    // Each byte is read from the data.  If a byte doesn't match the <Special Flag
    // Byte> (first byte) then the byte is simply drawn to the DMD ram.  As with all
    // encoding schemes the image for each of the 16 colums is actually drawn in
    // reverse as it appears in ram.
    //
    // If the next data byte that is read DOES match the <Special Flag Byte> then
    // the next 2 bytes are read, this makes a 3-byte pattern in the following
    // manner:
    //
    //  <Special Flag Byte>  <Repeat Count>  <XOR Value>
    //
    // When the <Special Flag Byte> is encountered, then the next 2 bytes represent
    // the <Repeat Count> and <XOR Value>.  The XOR Value is applied to the
    // EXISTING DMD ram for the number of bytes defined in <Repeat Count>.  That is,
    // the existing data in the RAM is XORed with the <XOR Value> for the number of
    // bytes in <Repeat Count>.
    //
    return this.decode_06or07(Source, WriteTypes.Rows);
  }

  private static decode_06or07(SourcePtr: number, Type: number) {
    let Dest = new Uint8Array(WPC.DmdPageBytes);
    let XorFlags = new Uint8Array(WPC.DmdPageBytes);
    let XorBits = new Uint8Array(WPC.DmdPageBytes);
    let DestPtr = 0;
    let XorFlagsPtr = 0;
    let XorBitsPtr = 0;
    let ch: number;
    let SpecialFlagByte: number;
    let WriteCounter: number;
    let XorFlagsCounter: number;
    let XorBitsCounter: number;

    SpecialFlagByte = ROM.byteAtAddr(SourcePtr);
    SourcePtr++;
    if (SourcePtr >= ROM.endPtr) {
      return [Dest, XorFlags, XorBits];
    }
    WriteCounter = XorFlagsCounter = XorBitsCounter = 0; // Stores bytes we've written to DMD Ram
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
          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            0x00,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
          const resultXorFlags = DmdDecoder.writeNext8BitValue(
            XorFlagsCounter,
            XorFlags,
            XorFlagsPtr,
            0xff,
            Type
          );
          XorFlagsPtr = resultXorFlags[0];
          XorFlags = resultXorFlags[1];
          XorFlagsCounter = resultXorFlags[2];
          const resultXorBits = DmdDecoder.writeNext8BitValue(
            XorBitsCounter,
            XorBits,
            XorBitsPtr,
            Value2,
            Type
          );
          XorBitsPtr = resultXorBits[0];
          XorBits = resultXorBits[1];
          XorBitsCounter = resultXorBits[2];
        } while (--Value1 && WriteCounter < WPC.DmdPageBytes);
      } else {
        const result = DmdDecoder.writeNext8BitValue(
          WriteCounter,
          Dest,
          DestPtr,
          ch,
          Type
        );
        DestPtr = result[0];
        Dest = result[1];
        WriteCounter = result[2];
        const resultXorFlags = DmdDecoder.writeNext8BitValue(
          XorFlagsCounter,
          XorFlags,
          XorFlagsPtr,
          0x00,
          Type
        );
        XorFlagsPtr = resultXorFlags[0];
        XorFlags = resultXorFlags[1];
        XorFlagsCounter = resultXorFlags[2];
        const resultXorBits = DmdDecoder.writeNext8BitValue(
          XorBitsCounter,
          XorBits,
          XorBitsPtr,
          0x00,
          Type
        );
        XorBitsPtr = resultXorBits[0];
        XorBits = resultXorBits[1];
        XorBitsCounter = resultXorBits[2];
      }
    } while (WriteCounter < WPC.DmdPageBytes);
    return [Dest, XorFlags, XorBits];
  }

  private static decode_08(Source: number) {
    // IMAGE TYPE 0x0B or 0x08                ; EC91h
    //
    // Bulk Skips and Bulk Repeats, Columns
    //
    // Format:
    //  Stream of Bytes:
    //   <StartWithDataRepeatFlag>
    //              |
    //              |       Start Value is zero-->
    //              +----------------------------------------\
    //              |                                        |
    //              |                                        |
    //     <NonZeroRepeatPattern> [RepeatThePattern] --> <SkipCount> --> [PerformBulkSkip]
    //              |                                                          |
    //              |                                           <-- when done  |
    //              \----------------------------------------------------------/
    //
    // This is identical to IMAGE TYPE 0x0C or 0x09 except data is drawn to DMD ram
    // in COLUMNS left to right.
    //
    // This encoding scheme is a sequential reading of the data bytes and cycle of
    // repeated data or row-per-column skipping.  This starts out reading the
    // very first byte of the data and if it is zero, the loop starts at the right
    // side of the diagram above at <SkipCount>.  If the first byte is non-zero then
    // the loop starts at the left side of the diagram above at
    // <NonZeroRepeatPattern>.
    //
    // When processing <NonZeroRepeatPattern>, if the byte is non-zero then the
    // subsequent byte is read and repeated for the number of times defined in the
    // previously read byte <NonZeroRepeatPattern>.  After doing this pattern
    // repeat, the <SkipCount> byte is read.  The 8-bit rows-per-column are skipped
    // for the number of times defined in <SkipCount>.  After skipping 8-bit rows
    // in the column (or across multiple columns), the loop goes back to evaluate
    // <NonZeroRepeatPattern> and this cycle continues until the entire DMD ram has
    // been filled.  Note the <SkipCount> value can be zero, this will cause no
    // skipping to occur and immediate wrap around to <NonZeroRepeatPattern>.
    //
    // As with all encoding schemes, the data appears on the DMD in reverse, for
    // each column as it is stored in ram.  This is for each of the 16 columns.
    //
    //
    // *** It appears the above write-up is incorrect, the left half does NOT
    // *** repeat the pattern, rather it is the count of the number of data bytes
    // *** to read from the source and then write to DMD ram, not repeat.
    //
    return this.decode_08or09(Source, WriteTypes.Columns);
  }

  private static decode_09(Source: number) {
    // IMAGE TYPE 0x0C or 0x09                ; EBFEh
    //
    // Bulk Skips and Bulk Repeats, Rows
    //
    // Format:
    //  Stream of Bytes:
    //   <StartWithDataRepeatFlag>
    //              |
    //              |       Start Value is zero-->
    //              +----------------------------------------\
    //              |                                        |
    //              |                                        |
    //     <NonZeroRepeatPattern> [RepeatThePattern] --> <SkipCount> --> [PerformBulkSkip]
    //              |                                                          |
    //              |                                           <-- when done  |
    //              \----------------------------------------------------------/
    //
    // This is identical to IMAGE TYPE 0x0B or 0x08 except data is drawn to DMD ram
    // in ROWS top to bottom.
    //
    // This encoding scheme is a sequential reading of the data bytes and cycle of
    // repeated data or 8-bit skipping.  This starts out reading the very first byte
    // of the data and if it is zero, the loop starts at the right side of the
    // diagram above at <SkipCount>.  If the first byte is non-zero then the loop
    // starts at the left side of the diagram above at <NonZeroRepeatPattern>.
    //
    // When processing <NonZeroRepeatPattern>, if the byte is non-zero then the
    // subsequent byte is read and repeated for the number of times defined in the
    // previously read byte <NonZeroRepeatPattern>.  After doing this pattern
    // repeat, the <SkipCount> byte is read.  Then 8-bits are skipped for the number
    // of times defined in <SkipCount>.  After repeatably skipping 8-bits the loop
    // goes back to evaluate <NonZeroRepeatPattern> and this cycle continues until
    // the entire DMD ram has been filled.  Note the <SkipCount> value can be zero,
    // this will cause no skipping to occur and immediate wrap around to
    // <NonZeroRepeatPattern>.
    //
    // As with all encoding schemes, the data appears on the DMD in reverse, for
    // each column as it is stored in ram.  This is for each of the 16 columns.
    //
    // *** It appears the above write-up is incorrect, the left half does NOT
    // *** repeat the pattern, rather it is the count of the number of data bytes
    // *** to read from the source and then write to DMD ram, not repeat.
    //
    return this.decode_08or09(Source, WriteTypes.Rows);
  }

  private static decode_08or09(SourcePtr: number, Type: number) {
    let DestPtr = 0;
    let Dest = new Uint8Array(WPC.DmdPageBytes);
    let SkippedPtr = 0;
    let Skipped = new Uint8Array(WPC.DmdPageBytes);
    let count: number;
    let pattern: number;
    let WriteCounter: number;
    let SkippedCounter: number;
    let continueLooping = true;

    function repeatSkips() {
      count = ROM.byteAtAddr(SourcePtr);
      SourcePtr++;
      if (SourcePtr >= ROM.endPtr) {
        return [Dest, Skipped];
      }
      if (count) {
        do {
          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            0x00,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
          const resultSkipped = DmdDecoder.writeNext8BitValue(
            SkippedCounter,
            Skipped,
            SkippedPtr,
            0xff,
            Type
          );
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
    WriteCounter = SkippedCounter = 0; // Stores bytes we've written to DMD Ram
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
          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            pattern,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
          const resultSkipped = DmdDecoder.writeNext8BitValue(
            SkippedCounter,
            Skipped,
            SkippedPtr,
            0x00,
            Type
          );
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

  private static decode_0A(Source: number) {
    // IMAGE TYPE 0x0D or 0x0A                ; EBFEh
    //
    // Write Data Bytes or Multiple Skips, Columns
    //
    // Format:
    //  0x04                   Image type byte, byte that got us this far.
    //   <Special Byte 1>      Special #1  Can be used for bitmap data.
    //   <Special Byte 2>      Special #2  Can be used for bitmap data.
    //   <Special Byte 3>      Special #3  Can be used for bitmap data.
    //   <Special Byte 4>      Special #4  Can be used for bitmap data.
    //   <Special Byte 5>      Special #5  Can be used for bitmap data.
    //   <Special Byte 6>      Special #6  Can be used for bitmap data.
    //   <Special Byte 7>      Special #7  Can be used for bitmap data.
    //   <Special Byte 8>      Special #8  Can be used for bitmap data.
    //    <data starts here>
    //
    //   Data Format (following the 8-byte header)
    //   -----------------------------------------
    //   <StartWithDataRepeatFlag>
    //              |
    //              |       Start Value is zero-->
    //              +---------------------------------\
    //              |                                 |
    //              |                                 |
    //        <DataLoadCount> [LoadDtaBytes] --> <SkipCount> --> [PerformBulkSkip]
    //              |                                                    |
    //              |                                     <-- when done  |
    //              \----------------------------------------------------/
    //
    // This encoding scheme is identical to IMAGE TYPE 0x0E or 0x0B except this
    // scheme writes the data on the DMD ram in COLUMNS.
    //
    // This encoding scheme first starts with the 8-byte header.  This is used by the
    // F322 function call which will read the data as a continuous bit-stream
    // starting at the 0x80 bit of the first byte and continuously working until the
    // DMD ram has been filled.  The F322 function checks for the 1 extension bit
    // to be set and if it is then the 8-byte header is used to index a particular
    // 8-bit pattern that should be used.  If the index bit is zero, the F322
    // function simply returns the 8-bits following the 0 non-extension bit.
    //
    // The data is written to the DMD ram in rows from LEFT to RIGHT.
    //
    // The diagram above shows the sequence of events, the very first data byte
    // (after the 8-byte header) is used to determine of the cycle should begin
    // at the right side <SkipCount> or the left side <DataLoadCount>.
    //
    // While processing through the loop, the <DataLoadCount> value indicates the
    // number of 8-bit values that should be drawn to the DMD ram.  The number F322
    // function is called for the number of times defined in <DataLoadCount>.  If
    // this value is zero there is no bytes to load and the <SkipCount> is checked
    // next.
    //
    // While processing through the loop, the <SkipCount> value indicates the number
    // of 8-bit bytes that should be skipped in the DMD ram.  If this value is zero
    // then there is no skipping and the following byte is read as the
    // <DataLoadCount> value.
    //
    return DmdDecoder.decode_0Aor0B(Source, WriteTypes.Columns);
  }

  private static decode_0B(Source: number) {
    // IMAGE TYPE 0x0E or 0x0B                ; EBC6h
    //
    // Write Data Bytes or Multiple Skips, Rows
    //
    // Format:
    //  0x04                   Image type byte, byte that got us this far.
    //   <Special Byte 1>      Special #1  Can be used for bitmap data.
    //   <Special Byte 2>      Special #2  Can be used for bitmap data.
    //   <Special Byte 3>      Special #3  Can be used for bitmap data.
    //   <Special Byte 4>      Special #4  Can be used for bitmap data.
    //   <Special Byte 5>      Special #5  Can be used for bitmap data.
    //   <Special Byte 6>      Special #6  Can be used for bitmap data.
    //   <Special Byte 7>      Special #7  Can be used for bitmap data.
    //   <Special Byte 8>      Special #8  Can be used for bitmap data.
    //    <data starts here>
    //
    //   Data Format (following the 8-byte header)
    //   -----------------------------------------
    //   <StartWithDataRepeatFlag>
    //              |
    //              |       Start Value is zero-->
    //              +---------------------------------\
    //              |                                 |
    //              |                                 |
    //        <DataLoadCount> [LoadDtaBytes] --> <SkipCount> --> [PerformBulkSkip]
    //              |                                                    |
    //              |                                     <-- when done  |
    //              \----------------------------------------------------/
    //
    // This encoding scheme is identical to IMAGE TYPE 0x0D or 0x0A except this
    // scheme writes the data on the DMD ram in ROWS.
    //
    // This encoding scheme first starts with the 8-byte header.  This is used by the
    // F322 function call which will read the data as a continuous bit-stream
    // starting at the 0x80 bit of the first byte and continuously working until the
    // DMD ram has been filled.  The F322 function checks for the 1 extension bit
    // to be set and if it is then the 8-byte header is used to index a particular
    // 8-bit pattern that should be used.  If the index bit is zero, the F322
    // function simply returns the 8-bits following the 0 non-extension bit.
    //
    // The data is written to the DMD ram in columns from TOP to BOTTOM.
    //
    // The diagram above shows the sequence of events, the very first data byte
    // (after the 8-byte header) is used to determine of the cycle should begin
    // at the right side <SkipCount> or the left side <DataLoadCount>.
    //
    // While processing through the loop, the <DataLoadCount> value indicates the
    // number of 8-bit values that should be drawn to the DMD ram.  The number F322
    // function is called for the number of times defined in <DataLoadCount>.  If
    // this value is zero there is no bytes to load and the <SkipCount> is checked
    // next.
    //
    // While processing through the loop, the <SkipCount> value indicates the number
    // of 8-bit bytes that should be skipped in the DMD ram.  If this value is zero
    // then there is no skipping and the following byte is read as the
    // <DataLoadCount> value.
    //
    return this.decode_0Aor0B(Source, WriteTypes.Rows);
  }

  private static decode_0Aor0B(SourcePtr: number, Type: number) {
    let DestPtr = 0;
    let Dest = new Uint8Array(WPC.DmdPageBytes);
    let SkippedPtr = 0;
    let Skipped = new Uint8Array(WPC.DmdPageBytes);
    let Header: Defines.ImageHeader = {
      ReadMask: 0x80,
      RepeatBytes: [0, 0, 0, 0, 0, 0, 0, 0],
      SpecialFlagByte: 0,
    };
    let count: number;
    let i: number;
    let WriteCounter: number;
    let SkippedCounter: number;
    let continueLooping = true;

    Header.ReadMask = 0x80;
    WriteCounter = SkippedCounter = 0; // Stores bytes we've written to DMD Ram

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
          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            0x00,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
          const resultSkipped = DmdDecoder.writeNext8BitValue(
            SkippedCounter,
            Skipped,
            SkippedPtr,
            0xff,
            Type
          );
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

          const result = DmdDecoder.writeNext8BitValue(
            WriteCounter,
            Dest,
            DestPtr,
            Read,
            Type
          );
          DestPtr = result[0];
          Dest = result[1];
          WriteCounter = result[2];
          if (SourcePtr >= ROM.endPtr) {
            return [Dest, Skipped];
          }

          const resultSkipped = DmdDecoder.writeNext8BitValue(
            SkippedCounter,
            Skipped,
            SkippedPtr,
            0x00,
            Type
          );
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

  private static writeNext8BitValue(
    WriteCounterPtr: number,
    Dest: Uint8Array,
    DestPtr: number,
    ch: number,
    Type: number
  ): [number, Uint8Array, number] {
    return DmdDecoder.writeNext8BitValueAnySize(
      WriteCounterPtr,
      Dest,
      DestPtr,
      ch,
      Type,
      WPC.DmdCols,
      WPC.DmdRows
    );
  }

  private static writeNext8BitValueAnySize(
    WriteCounterPtr: number,
    Dest: Uint8Array,
    DestPtr: number,
    ch: number,
    Type: number,
    cols: number,
    rows: number
  ): [number, Uint8Array, number] {
    Dest.set([ch], DestPtr); // Write the actual 8-bit value
    WriteCounterPtr++;
    if (WriteCounterPtr >= Math.ceil(Math.ceil(cols / 8) * 8 * rows) / 8) {
      return [DestPtr, Dest, WriteCounterPtr];
    }

    if (Type == WriteTypes.Rows) {
      DestPtr++;
      return [DestPtr, Dest, WriteCounterPtr];
    }

    if (!(WriteCounterPtr % rows)) {
      //
      // We just finished writing 32 bytes for a particular column.
      // We need to Adjust the write pointer to point up to the top
      // of the next column over.
      //
      DestPtr -= (cols / 8) * (rows - 2) + (cols / 8 - 1);
    } else {
      //
      // We just finished writing some byte within the 32-byte column
      // NOT the last row of the column, so just advance to next row down
      // within this column.
      //
      DestPtr += cols / 8;
    }
    return [DestPtr, Dest, WriteCounterPtr];
  }

  private static readNext8BitValue(
    Header: Defines.ImageHeader,
    SourcePtr: number
  ) {
    let returnValues: [Defines.ImageHeader, number, number];
    const result = DmdDecoder.readNextBit(Header, SourcePtr);
    let ch = result[0];
    Header = result[1];
    SourcePtr = result[2];
    if (SourcePtr >= ROM.endPtr) {
      returnValues = [Header, 0x00, SourcePtr];
      return returnValues;
    }
    let WriteMask: number;
    let ReturnValue: number;
    let i: number;

    if (ch) {
      let OnesCount = 0;
      for (i = 0; i < 7; i++) {
        // at most 7 one-bits to follow
        const result = DmdDecoder.readNextBit(Header, SourcePtr);
        Header = result[1];
        SourcePtr = result[2];
        if (result[0]) {
          OnesCount++;
        } else {
          i = 7;
        }
        if (SourcePtr >= ROM.endPtr) {
          returnValues = [Header, 0x00, SourcePtr];
          return returnValues;
        }
      }
      ReturnValue = Header.RepeatBytes[OnesCount];
    } else {
      //
      // Read the next 8 bits and return the value.
      //
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

  private static readNextBit(Header: Defines.ImageHeader, SourcePtr: number) {
    let returnValues: [number, Defines.ImageHeader, number];
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

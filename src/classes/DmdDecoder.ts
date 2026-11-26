import * as Defines from "../resources/Defines.js";
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
import { RomReader } from "./RomReader.js";
import { PlaneWriter } from "./PlaneWriter.js";
import { decode00 } from "./encodings/Encoding00.js";
import { decode01, decode02 } from "./encodings/Encoding01or02.js";
import { decode03 } from "./encodings/Encoding03.js";
import { decode04, decode05 } from "./encodings/Encoding04or05.js";
import { decode06, decode07 } from "./encodings/Encoding06or07.js";
import { decode08, decode09 } from "./encodings/Encoding08or09.js";
import { decode0A, decode0B } from "./encodings/Encoding0Aor0B.js";

/** A position in the font tables: which table, and which image in it. */
type ImagePosition = {
  tableIndex: number;
  imageIndex: number;
};

export class DmdDecoder {
  public static decodeNextIndex(count: number, dataType: number) {
    switch (dataType) {
      case DataTypes.Graphics:
        while (count--) {
          //if (FullFrameImageData.currentImageIndex < MAX_GRAPHIC_INDEX)
          {
            FullFrameImageData.currentImageIndex++;
          }
        }
        break;

      case DataTypes.FontData:
      case DataTypes.AniData:
        //
        if (
          VariableSizedImageData.planes.plane0.status ==
          PlaneStatuses.Valid
        ) {
          if (
            VariableSizedImageData.currentImageXShift + WPC.DmdCols <
            VariableSizedImageData.currentImageXSize
          ) {
            VariableSizedImageData.currentImageXShift +=
              WPC.ImageShiftXPixelCount * count;
            break;
          }
          if (
            VariableSizedImageData.currentImageYShift + WPC.DmdRows <
            VariableSizedImageData.currentImageYSize
          ) {
            VariableSizedImageData.currentImageYShift +=
              WPC.ImageShiftYPixelCount * count;
            break;
          }
        }
        VariableSizedImageData.currentImageXShift = -1;
        VariableSizedImageData.currentImageYShift = -1;
        //
        while (count--) {
          const next = DmdDecoder.incrementVariableSizedImageIndex({
            tableIndex: VariableSizedImageData.currentTableIndex,
            imageIndex: VariableSizedImageData.currentImageIndex,
          });
          VariableSizedImageData.currentTableIndex = next?.tableIndex ?? -1;
          VariableSizedImageData.currentImageIndex = next?.imageIndex ?? -1;
          if (next === null) {
            logStr(`Unexpected error advancing image indexes`);
          }
        }
        break;

      default:
        break;
    }
  }

  private static incrementVariableSizedImageIndex(
    position: ImagePosition
  ): ImagePosition | null {
    let { tableIndex, imageIndex } = position;

    if (tableIndex == null || imageIndex == null) {
      return null;
    }

    //
    const lastImageIndex = DataParser.getLastImageIndex(
      imageIndex,
      tableIndex
    ).last;
    if (lastImageIndex == -1) {
      return null;
    }

    //
    if ((imageIndex & 0xff) < (lastImageIndex & 0xff)) {
      //
      imageIndex = DataParser.getNextImageIndex(imageIndex, tableIndex);
      if (imageIndex == -1) {
        return null;
      }

      return { tableIndex, imageIndex };
    }

    if (tableIndex < VariableSizedImageData.maxTableIndex) {
      //
      tableIndex++;
      //
      imageIndex = DataParser.getFirstImageIndex(tableIndex);
      if (imageIndex == -1) {
        return null;
      }
      return { tableIndex, imageIndex };
    }

    // else we must be at last indexes, do nothing, just return 0, no errors.
    return { tableIndex: 0, imageIndex: 0 };
  }

  private static decrementVariableSizedImageIndex(
    position: ImagePosition
  ): ImagePosition | null {
    let { tableIndex, imageIndex } = position;

    if (tableIndex == null || imageIndex == null) {
      return null;
    }

    //
    const firstImageIndex = DataParser.getFirstImageIndex(tableIndex);
    if (firstImageIndex == -1) {
      return null;
    }

    //
    if ((imageIndex & 0xff) > (firstImageIndex & 0xff)) {
      //
      imageIndex = DataParser.getPrevImageIndex(imageIndex, tableIndex);
      if (imageIndex == -1) {
        return null;
      }
      return { tableIndex, imageIndex };
    }
    if (tableIndex > VariableSizedImageData.minTableIndex) {
      //
      tableIndex = tableIndex - 1;

      // NOTE: DMD.cpp checks the error code of GetLastImageIndex() here and
      // sets the image index to the last image of the table. This checks the
      // image index instead. Kept as is.
      if (DataParser.getLastImageIndex(imageIndex, tableIndex).last != 0) {
        return null;
      }
      return { tableIndex, imageIndex };
    }

    // else we must be at first indexes, do nothing, just return 0, no errors.
    return { tableIndex, imageIndex };
  }

  public static decodePreviousIndex(count: number, dataType: number) {
    switch (dataType) {
      case DataTypes.Graphics:
        while (count-- && FullFrameImageData.currentImageIndex) {
          FullFrameImageData.currentImageIndex--;
        }
        break;

      case DataTypes.FontData:
      case DataTypes.AniData:
        //
        if (
          VariableSizedImageData.planes.plane0.status ==
          PlaneStatuses.Valid
        ) {
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
        //
        while (count--) {
          const prev = DmdDecoder.decrementVariableSizedImageIndex({
            tableIndex: VariableSizedImageData.currentTableIndex,
            imageIndex: VariableSizedImageData.currentImageIndex,
          });
          VariableSizedImageData.currentTableIndex = prev?.tableIndex ?? -1;
          VariableSizedImageData.currentImageIndex = prev?.imageIndex ?? -1;
        }
        break;

      default:
        break;
    }
  }

  public static decodeFullFrameGraphic(graphicIndex: number) {
    FullFrameImageData.planes.plane0 = this.decodeImageToPlane(graphicIndex);
    FullFrameImageData.planes.plane1 = this.decodeImageToPlane(
      graphicIndex + 1
    );
  }

  public static decodeVariableSizedImageData() {
    VariableSizedImageData.planes =
      DmdDecoder.decodeVariableSizedImageIndexToPlane(
        VariableSizedImageData.currentTableIndex,
        VariableSizedImageData.currentImageIndex
      );

    // If error then force any stale offset values to 0

    if (VariableSizedImageData.planes.plane0.status != PlaneStatuses.Valid) {
      VariableSizedImageData.currentImageXSize = 0;
      VariableSizedImageData.currentImageYSize = 0;
      VariableSizedImageData.currentImageXShift = 0;
      VariableSizedImageData.currentImageYShift = 0;
    }
  }

  public static decodeVariableSizedImageIndexToPlane(
    tableIndex: number,
    imageIndex: number
  ): Defines.DmdPlanes {
    const planes: Defines.DmdPlanes = {
      plane0: DmdDecoder.decodePlaneInit(),
      plane1: DmdDecoder.decodePlaneInit(),
    };

    //
    VariableSizedImageData.currentImageXSize = 0;
    VariableSizedImageData.currentImageYSize = 0;

    const addr = DataParser.getROMAddressOfVariableSizedImageIndex(
      tableIndex,
      imageIndex
    );
    VariableSizedImageData.address = addr ?? -1;

    if (addr === null) {
      planes.plane0.status = PlaneStatuses.BadDimension;
      planes.plane1.status = PlaneStatuses.BadDimension;
      return planes;
    }

    return DmdDecoder.decodeVariableSizedImage(addr, planes, tableIndex);
  }

  private static decodeVariableSizedImage(
    source: number,
    planes: Defines.DmdPlanes,
    tableIndex: number
  ): Defines.DmdPlanes {
    VariableSizedImageData.address = source;
    const src = new RomReader(source);

    const ch = src.peek();

    const metadata = DataParser.getVariableSizedImageTableMetadata(tableIndex);
    if (metadata === null) {
      logStr(
        `Unexpected problem looking up TableIndex ${tableIndex} height & spacing`
      );
      return planes;
    }
    if (ch > 0 && ch <= WPC.DmdCols) {
      planes = DmdDecoder.decodeVariableSizedImageNoHeader(
        src,
        planes,
        metadata.height
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
      planes = DmdDecoder.decodeVariableSizedImageHeader(
        src,
        planes,
        tableIndex
      );
    }
    return planes;
  }

  // Unlike DecodeVariableSizedImage_Centered() in DMD.cpp, this does not
  // center the image in a 128 x 32 plane. The plane gets the size of the image.
  private static decodeVariableSizedImageToBits(
    src: RomReader,
    imageHeight: number,
    imageWidth: number
  ): [number, Uint8Array] {
    const out = new PlaneWriter(
      new Uint8Array(Math.ceil(Math.ceil(imageWidth / 8) * 8 * imageHeight) / 8),
      WriteTypes.Rows,
      imageWidth,
      imageHeight
    );

    if (src.atEnd) {
      return [PlaneStatuses.ImageOutOfRange, out.data];
    }

    //

    if (VariableSizedImageData.currentImageYShift == -1) {
      VariableSizedImageData.currentImageYShift = 0;
      while (
        WPC.DmdRows + VariableSizedImageData.currentImageYShift <
        imageHeight
      ) {
        VariableSizedImageData.currentImageYShift += WPC.ImageShiftYPixelCount;
      }
    }
    //
    if (VariableSizedImageData.currentImageXShift == -1) {
      VariableSizedImageData.currentImageXShift = 0;
      while (
        WPC.DmdCols + VariableSizedImageData.currentImageXShift <
        imageWidth
      ) {
        VariableSizedImageData.currentImageXShift += WPC.ImageShiftXPixelCount;
      }
    }
    // Soak up source bytes to account for Y shift
    // NOTE: (imageWidth + 7) / 8 is not rounded down here, unlike the integer
    // division in DMD.cpp. Kept as is.
    for (let i = 0; i < VariableSizedImageData.currentImageYShift; i++) {
      for (let j = 0; j < (imageWidth + 7) / 8; j++) {
        if (src.atEnd) {
          return [PlaneStatuses.ImageOutOfRange, out.data];
        }
        src.skip();
      }
    }

    //
    for (let i = 0; i < imageHeight && !out.full; i++) {
      // Now write actual image pixel bytes
      for (let j = 0; j < Math.floor((imageWidth + 7) / 8); j++) {
        if (src.atEnd) {
          return [PlaneStatuses.ImageOutOfRange, out.data];
        }
        const ch = src.u8();
        if (
          j >=
            Math.floor((VariableSizedImageData.currentImageXShift + 7) / 8) &&
          j <
            Math.floor(
              imageWidth + VariableSizedImageData.currentImageXShift + 7
            ) /
              8
        ) {
          out.write(ch);
        }
      }
    }

    // Soak up source bytes to finish reading entire bitmap for oversized images that use 0xFF encoding, src will be sitting at next plane
    for (
      let i = 0;
      i <
      imageHeight - (WPC.DmdRows + VariableSizedImageData.currentImageYShift);
      i++
    ) {
      for (let j = 0; j < (imageWidth + 7) / 8; j++) {
        if (src.atEnd) {
          return [PlaneStatuses.ImageOutOfRange, out.data];
        }
        src.skip();
      }
    }

    //
    VariableSizedImageData.currentImageXSize = imageWidth;
    VariableSizedImageData.currentImageYSize = imageHeight;

    return [PlaneStatuses.Valid, out.data];
  }

  private static decodeVariableSizedImageNoHeader(
    src: RomReader,
    planes: Defines.DmdPlanes,
    tableHeight: number
  ) {
    //
    planes.plane0.status = PlaneStatuses.Invalid;
    planes.plane1.status = PlaneStatuses.Invalid;

    // Note, ->size not shown for VariableSizedImageData display.
    planes.plane0.size = 0;
    planes.plane1.size = 0;

    //
    if (src.atEnd) {
      logStr(
        `Address is out of bounds in decodeVariableSizedImageNoHeader()`
      );
      return planes;
    }
    const imageWidth = src.u8();

    //
    const result = this.decodeVariableSizedImageToBits(
      src,
      tableHeight,
      imageWidth
    );
    planes.plane0.status = result[0];
    planes.plane0.data = result[1];
    return planes;
  }

  private static decodeVariableSizedImageHeader(
    src: RomReader,
    planes: Defines.DmdPlanes,
    tableIndex: number
  ) {
    //
    planes.plane0.status = PlaneStatuses.Invalid;
    planes.plane1.status = PlaneStatuses.Invalid;

    // Note, ->size not shown for VariableSizedImageData display.
    planes.plane0.size = 0;
    planes.plane0.size = 0;

    planes.plane0.address = src.pos;
    planes.plane1.address = src.pos;

    //
    const headerByte = src.u8();
    if (src.atEnd) {
      return planes;
    }
    src.u8(); // vertical offset, not used
    if (src.atEnd) {
      return planes;
    }
    src.u8(); // horizontal offset, not used
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

    //
    switch (headerByte) {
      case ImageCodes.BicolorDirect: {
        // NOTE: both planes are read from the same position here. In DMD.cpp
        // plane 0 is read after plane 1. Kept as is.
        const result1 = this.decodeVariableSizedImageToBits(
          new RomReader(src.pos),
          imageHeight,
          imageWidth
        );
        planes.plane1.status = result1[0];
        planes.plane1.data = result1[1];
        const result0 = this.decodeVariableSizedImageToBits(
          new RomReader(src.pos),
          imageHeight,
          imageWidth
        );
        planes.plane0.status = result0[0];
        planes.plane0.data = result0[1];
        break;
      }

      case ImageCodes.BicolorIndirect: {
        const pointer = DataParser.extractWPCAddrAndPageOfImageTable(tableIndex);
        if (pointer === null) {
          logStr(
            `decodeVariableSizedImageHeader(), Unexpected problem looking up TableIndex ${tableIndex} WPC Page`
          );
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

        // NOTE: this passes the first address byte as a ROM position, and
        // below uses a ROM byte as the position of the other plane. DMD.cpp
        // reads the 3-byte address in tmpBuf instead. Kept as is.
        const addr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(tmpBuf[0]);
        if (addr === null) {
          logStr(
            `decodeVariableSizedImageHeader(), Unexpected problem looking up ROM address of bi-color plane from 3-byte WPC Addr ${
              tmpBuf[0] & 0xff
            } ${tmpBuf[1] & 0xff} ${tmpBuf[2] & 0xff}`
          );
          return planes;
        }

        const biColor = ROM.byteAtAddr(addr);

        //
        const result1 = this.decodeVariableSizedImageToBits(
          new RomReader(biColor),
          imageHeight,
          imageWidth
        );
        planes.plane1.status = result1[0];
        planes.plane1.data = result1[1];

        const result0 = this.decodeVariableSizedImageToBits(
          src,
          imageHeight,
          imageWidth
        );
        planes.plane0.status = result0[0];
        planes.plane0.data = result0[1];
        break;
      }

      case ImageCodes.FD:
      default: {
        const result = this.decodeVariableSizedImageToBits(
          src,
          imageHeight,
          imageWidth
        );
        planes.plane0.status = result[0];
        planes.plane0.data = result[1];
        break;
      }
    }
    return planes;
  }

  public static getImageEncoding(index: number) {
    const plane = this.decodeImageToPlane(index);
    return plane.encoding;
  }

  private static decodeImageToPlane(index: number, skipDecoding = false) {
    const plane = DmdDecoder.decodePlaneInit();

    //
    plane.tableAddress = FullFrameImageData.tableAddress;

    // Each graphic table entry is 3 bytes long
    const addr = FullFrameImageData.tableAddress + index * 3;

    if (addr >= ROM.size) {
      plane.status = PlaneStatuses.TableEntryOutOfRange;
      return plane;
    }
    const romAddr = DataParser.getROMAddressFromAddrOf3ByteWPCAddrPage(addr);
    if (romAddr === null) {
      logStr(
        `decodeImageToPlane() got error from GetROMAddressFromAddrOf3ByteWPCAddrPage()`
      );
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

  private static decodePlaneInit() {
    //
    // We'll clear out the page of data bytes here..
    // Each field gets its own buffer, like memset() on the C struct.
    //
    const plane: Defines.DmdPlane = {
      size: 0,
      data: new Uint8Array(WPC.DmdPageBytes),
      skipped: new Uint8Array(WPC.DmdPageBytes),
      xorFlags: new Uint8Array(WPC.DmdPageBytes),
      xorBits: new Uint8Array(WPC.DmdPageBytes),
      status: PlaneStatuses.Valid, // Assume the image will be valid unless otherwise determined
      encoding: 255,
      address: 0,
      tableAddress: 0,
    };

    return plane;
  }

  private static decodeFullFrameGraphicImage(
    src: RomReader,
    plane: Defines.DmdPlane,
    skipDecoding: boolean
  ) {
    const ch = src.peek();
    plane.encoding = ch & 0x0f;
    plane.address = src.pos;

    if (skipDecoding) {
      // If we just want to get the type, let's skip all the decoding.
      return;
    }

    src.skip();
    if (src.atEnd) {
      plane.status = PlaneStatuses.ImageOutOfRange;
      return;
    }

    //
    logStr(`Type ${toHex(ch)}`);

    switch (ch & 0x0f) {
      case 0x00: //  Raw 32 bytes by 16 byes copy, no encodings.
        plane.data = decode00(src);
        return;
      case 0x01: //  Simple Repeats, Columns
        plane.data = decode01(src);
        return;
      case 0x02: //  Simple Repeats, Rows
        plane.data = decode02(src);
        return;
      case 0x03: //  <unsure>
        decode03(src);
        plane.status = PlaneStatuses.Unimplemented;
        return; // this is a cheat but we know that type 03 is not being decoded
      case 0x04: //  Complex Repeats, 9-byte header, Columns
        plane.data = decode04(src);
        return;
      case 0x05: //  Complex Repeats, 9-byte header, Rows
        plane.data = decode05(src);
        return;
      case 0x06: {
        //  XOR-Repeat, Columns
        const [data, xorFlags, xorBits] = decode06(src);
        plane.data = data;
        plane.xorFlags = xorFlags;
        plane.xorBits = xorBits;
        return;
      }
      case 0x07: {
        //  XOR-Repeat, Rows
        const [data, xorFlags, xorBits] = decode07(src);
        plane.data = data;
        plane.xorFlags = xorFlags;
        plane.xorBits = xorBits;
        return;
      }
      case 0x08: {
        //  Bulk Skips and Bulk Repeats, Columns
        const [data, skipped] = decode08(src);
        plane.data = data;
        plane.skipped = skipped;
        return;
      }
      case 0x09: {
        //  Bulk Skips and Bulk Repeats, Rows
        const [data, skipped] = decode09(src);
        plane.data = data;
        plane.skipped = skipped;
        return;
      }
      case 0x0a: {
        //  Write Data Bytes or Multiple Skips, Columns
        const [data, skipped] = decode0A(src);
        plane.data = data;
        plane.skipped = skipped;
        return;
      }
      case 0x0b: {
        //  Write Data Bytes or Multiple Skips, Rows
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

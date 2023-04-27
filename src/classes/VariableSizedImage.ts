import { DmdDecoder } from "./DmdDecoder.js";
import { DataTypes, WPC } from "../resources/Constants.js";
import { VariableSizedImageData } from "../stores/VariableSizedImageData.js";
import { Plane } from "../resources/Plane.js";
import { ROM } from "../stores/ROM.js";

export class VariableSizedImage {
  private static instance: VariableSizedImage;

  private static currentPlane: Plane = {
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

  public static init() {
    if (VariableSizedImage.instance) {
      return this.instance;
    }
    this.instance = new VariableSizedImage();
    return this.instance;
  }

  private constructor() {
    VariableSizedImageData.init();
  }

  public prev(steps: number) {
    DmdDecoder.decodePreviousIndex(steps, DataTypes.FontData);
  }

  public next(steps: number) {
    DmdDecoder.decodeNextIndex(steps, DataTypes.FontData);
  }

  public get maxImageIndex() {
    return VariableSizedImageData.maxImageIndex;
  }

  public get minImageIndex() {
    return VariableSizedImageData.minImageIndex;
  }

  public get maxTableIndex() {
    return VariableSizedImageData.maxTableIndex;
  }

  public get minTableIndex() {
    return VariableSizedImageData.minTableIndex;
  }

  public get indexMap() {
    return ROM.vSImageTableMap;
  }

  public set index(index: number) {
    VariableSizedImageData.CurrentImageIndex = index;
  }

  public get index() {
    return VariableSizedImageData.CurrentImageIndex;
  }

  public set table(table: number) {
    VariableSizedImageData.CurrentTableIndex = table;
  }

  public get table() {
    return VariableSizedImageData.CurrentTableIndex;
  }

  public getImageAt(table: number, index: number) {
    VariableSizedImageData.CurrentTableIndex = table;
    VariableSizedImageData.CurrentImageIndex = index;
    VariableSizedImage._getCurrent();
    return VariableSizedImage.currentPlane;
  }

  public get plane(): Plane {
    VariableSizedImage._getCurrent();
    return VariableSizedImage.currentPlane;
  }

  public placeInFullFrame(
    vsPlane: Plane,
    xOffset: number,
    yOffset: number,
    fullFrameImage = new Uint8Array(WPC.DmdPageBytes)
  ) {
    const vsByteWidth = Math.ceil(vsPlane.width / 8); // The size of the VS image, rounded up to full bytes
    const bitOffset = xOffset % 8; // The bits will be moved this amount within the destination bytes

    // Calculate how many bytes the VS image will need when the offset has been applied:
    const bytesPerRow = Math.ceil((bitOffset + vsPlane.width + 1) / 8);
    const vsImageLength = bytesPerRow * vsPlane.height;

    // Masks values for merging the fullframe image with the VS image
    const startMask = 0xff >> (8 - bitOffset);
    const endMask = (0xff << (xOffset + vsPlane.width) % 8) & 0xff;

    for (let i = 0; i < vsImageLength; i++) {
      const col = i % bytesPerRow;
      const row = Math.floor(i / bytesPerRow);

      // References to the original bytes in the VS image:
      const prevByteIndex = vsByteWidth * row + (col - 1);
      const thisByteIndex = vsByteWidth * row + col;

      // Calculate the byte position in the fullframe image that will be written over by the new bytes:
      const destXPos = Math.floor(xOffset / 8) + col;
      const destYPos = yOffset + row;
      const destPos = destYPos * (WPC.DmdCols / 8) + destXPos;

      // Store the original value of that byte so that we can merge them:
      const sourceByte = fullFrameImage[destPos];
      let mergeByte = sourceByte & startMask; // removing the bits that should contain the VS image

      // Figuring out the new byte values, after the offset has been applied:
      let prevByte = 0x00;
      let thisByte = 0x00;

      // Move the bits to their new position:
      if (col > 0) {
        prevByte = (vsPlane.image[prevByteIndex] >> (8 - bitOffset)) & 0xff;
        mergeByte = 0x00; // Only merge with the fullframe image if it is the first byte in the line
      }
      if (col < bytesPerRow) {
        thisByte = (vsPlane.image[thisByteIndex] << bitOffset) & 0xff;
        thisByte = (mergeByte + thisByte) & 0xff;
      }
      let destByte = prevByte + thisByte; // Combine the bytes

      // Remove the last bits and merge with the fullframe image:
      if (col == bytesPerRow - 1) {
        destByte = destByte & (0xff >> (8 - ((xOffset + vsPlane.width) % 8)));
        destByte = destByte + (sourceByte & endMask);
      }
      // Store the byte back into the fullframe image:
      fullFrameImage[destPos] = destByte;
    }
    return fullFrameImage;
  }

  private static _getCurrent() {
    DmdDecoder.decodeVariableSizedImageIndexToPlane(
      VariableSizedImageData.CurrentTableIndex,
      VariableSizedImageData.CurrentImageIndex
    );
    DmdDecoder.decodeVariableSizedImageData();
    VariableSizedImage.currentPlane.image =
      VariableSizedImageData.Planes.Plane0.Plane_Data;
    VariableSizedImage.currentPlane.mask =
      VariableSizedImageData.Planes.Plane0.Plane_Skipped;
    VariableSizedImage.currentPlane.xor =
      VariableSizedImageData.Planes.Plane0.Plane_XorBits;
    VariableSizedImage.currentPlane.type =
      VariableSizedImageData.Planes.Plane0.Plane_Encoding;
    VariableSizedImage.currentPlane.width =
      VariableSizedImageData.CurrentImageXSize;
    VariableSizedImage.currentPlane.height =
      VariableSizedImageData.CurrentImageYSize;
    VariableSizedImage.currentPlane.xOffset =
      VariableSizedImageData.CurrentImageXShift;
    VariableSizedImage.currentPlane.yOffset =
      VariableSizedImageData.CurrentImageYShift;
    VariableSizedImage.currentPlane.address = VariableSizedImageData.Address;
    VariableSizedImage.currentPlane.tableAddress =
      VariableSizedImageData.TableAddress;
  }
}

import { DataTypes, WPC } from "../resources/Constants.js";
import { DmdDecoder } from "./DmdDecoder.js";
import { FullFrameImageData } from "../stores/FullFrameImageData.js";
import { Plane } from "../resources/Plane.js";

export class FullFrameImage {
  private static instance: FullFrameImage;

  private static currentPlane: Plane = {
    width: WPC.DmdCols,
    height: WPC.DmdRows,
    image: new Uint8Array(WPC.DmdPageBytes),
    mask: new Uint8Array(WPC.DmdPageBytes),
    xor: new Uint8Array(WPC.DmdPageBytes),
    flags: new Uint8Array(WPC.DmdPageBytes),
    xOffset: 0,
    yOffset: 0,
    type: 255,
    address: 0,
    tableAddress: 0,
  };

  public static init() {
    if (FullFrameImage.instance) {
      return this.instance;
    }
    this.instance = new FullFrameImage();
    return this.instance;
  }

  private constructor() {
    FullFrameImageData.init();
  }

  public prev(steps: number) {
    DmdDecoder.decodePreviousIndex(steps, DataTypes.Graphics);
  }

  public next(steps: number) {
    DmdDecoder.decodeNextIndex(steps, DataTypes.Graphics);
  }

  public get minImageIndex() {
    return 0;
  }

  public get maxImageIndex() {
    /*
        WPC Edit has no way to find the last DMD image so I use this
        approach to figure out a max index: counting the amount of
        invalid frames. This may sometimes result in quite a lot of 
        jibberish frames at the end, but at least all the valid ones
        seems to be included.
        */
    let index = 200;
    let invalidImages = 0;
    while (invalidImages < 3 && index < 2000) {
      const plane = this.getPlaneAt(index);
      if (plane.type > 11 && plane.type != 255) {
        invalidImages++;
      }
      index++;
    }
    return index;
  }

  public set index(index: number) {
    FullFrameImageData.currentImageIndex = Math.max(0, index);
  }

  public get index() {
    return FullFrameImageData.currentImageIndex;
  }

  public get plane(): Plane {
    FullFrameImage._getCurrent();
    return FullFrameImage.currentPlane;
  }

  public getPlaneAt(index: number) {
    FullFrameImageData.currentImageIndex = Math.max(0, index);
    FullFrameImage._getCurrent();
    return FullFrameImage.currentPlane;
  }

  public mergeImages(img1: Uint8Array, img2: Uint8Array, mask: Uint8Array) {
    // make sure the data stays within bounds if the planes would have different sizes (though they SHOULD always be the same):
    const imageSize = Math.min(img1.length, img2.length, mask.length);

    let mergedImage = new Uint8Array(imageSize);
    let i;
    for (i = 0; i < imageSize; i++) {
      if (mask[i] == 0xff) {
        mergedImage[i] = img1[i];
      } else {
        mergedImage[i] = img2[i];
      }
    }
    return mergedImage;
  }

  public mergePlanes(img1: Uint8Array, plane2: Plane) {
    const img2 = plane2.image;
    const mask = plane2.mask;
    const xor = plane2.xor;
    const flags = plane2.flags;
    // make sure the data stays within bounds if the planes would have different sizes (though they SHOULD always be the same):
    const imageSize = Math.min(img1.length, img2.length);

    let mergedImage = new Uint8Array(imageSize);
    let i;
    for (i = 0; i < imageSize; i++) {
      let skip = false;
      let img1Byte = img1[i];
      let img2Byte = img2[i];
      if (flags[i] > 0) {
        // if it got an xor flag, loop the byte and apply it
        for (let j = 0; j < 8; j++) {
          const xorBit = (xor[i] >> j) & 0x01;
          const flagBit = (flags[i] >> j) & 0x01;
          const img1Bit = (img1Byte >> j) & 0x01;
          if (flagBit) {
            if (xorBit) {
              // XOR flag <and> XOR bit then flip bit from previous display
              img2Byte |= (~img1Bit & 0x01) << j;
            } else {
              // XOR flag <and NOT> XOR bit, then treat it as a skip
              img2Byte |= img1Bit << j;
            }
          }
        }
      }
      if (mask[i] == 0xff) {
        mergedImage[i] = img1Byte;
      } else {
        mergedImage[i] = img2Byte;
      }
    }
    return mergedImage;
  }

  private static _getCurrent() {
    DmdDecoder.decodeFullFrameGraphic(FullFrameImageData.currentImageIndex);
    FullFrameImage.currentPlane.image =
      FullFrameImageData.planes.plane0.data;
    FullFrameImage.currentPlane.mask =
      FullFrameImageData.planes.plane0.skipped;
    FullFrameImage.currentPlane.xor =
      FullFrameImageData.planes.plane0.xorBits;
    FullFrameImage.currentPlane.flags =
      FullFrameImageData.planes.plane0.xorFlags;
    FullFrameImage.currentPlane.type =
      FullFrameImageData.planes.plane0.encoding;
    FullFrameImage.currentPlane.address =
      FullFrameImageData.planes.plane0.address;
    FullFrameImage.currentPlane.tableAddress =
      FullFrameImageData.planes.plane0.tableAddress;
  }
}

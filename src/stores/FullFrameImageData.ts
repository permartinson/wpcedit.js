import * as Defines from "../resources/Defines.js";
import { WPC } from "../resources/Constants.js";

export class FullFrameImageData {
  public static tableAddress = 0;
  public static currentImageIndex = 0;
  public static planes: Defines.DmdPlanes;
  private static instance: FullFrameImageData;

  private constructor() {
    const plane = new Uint8Array(WPC.DmdPageBytes);
    const dmdPlane: Defines.DmdPlane = {
      status: 0,
      size: 0,
      data: plane,
      skipped: plane,
      xorFlags: plane,
      xorBits: plane,
      encoding: 255,
      address: 0,
      tableAddress: 0,
    };
    FullFrameImageData.planes = {
      plane0: dmdPlane,
      plane1: dmdPlane,
    };
  }

  public static init() {
    if (FullFrameImageData.instance) {
      return this.instance;
    }
    this.instance = new FullFrameImageData();
    return this.instance;
  }
}

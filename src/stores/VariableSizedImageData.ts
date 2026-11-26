import * as Defines from "../resources/Defines.js";
import { WPC } from "../resources/Constants.js";

export class VariableSizedImageData {
  public static tableAddress = 0;
  public static address = 0;

  public static currentTableIndex = 0;
  public static currentImageIndex = 0;
  public static currentImageXSize = 0;
  public static currentImageYSize = 0;

  public static currentImageXShift = 0;
  public static currentImageYShift = 0;

  public static minTableIndex = 0;
  public static minImageIndex = 0;
  public static maxTableIndex = 0;
  public static maxImageIndex = 0;

  public static planes: Defines.DmdPlanes;

  private static instance: VariableSizedImageData;

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
    VariableSizedImageData.planes = {
      plane0: dmdPlane,
      plane1: dmdPlane,
    };
  }

  public static init() {
    if (VariableSizedImageData.instance) {
      return this.instance;
    }
    this.instance = new VariableSizedImageData();
    return this.instance;
  }
}

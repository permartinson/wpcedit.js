  export type DMDPlane = {
    Address: number,
    Table_Address: number,
    Plane_Status: number;
    Plane_Size: number;
    Plane_Data: Uint8Array;
    Plane_Skipped: Uint8Array;
    Plane_XorFlags: Uint8Array;
    Plane_XorBits: Uint8Array;
    Plane_Encoding: number;
  };
  
  export type DMDPlanes = {
    Plane0: DMDPlane;
    Plane1: DMDPlane;
  };
  
  export  type ImageHeader = {
    SpecialFlagByte: number;
    RepeatBytes: number[];
    ReadMask: number;
  };
  
  export enum typedef {
    ThisPixel_Off = 0,
    ThisPixel_On,
    ThisPixel_Xored,
    ThisPixel_Skipped,
  }
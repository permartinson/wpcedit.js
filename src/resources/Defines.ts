/** One decoded DMD plane, like the DMDPlane struct in the original WPC Edit. */
export type DmdPlane = {
  address: number;
  tableAddress: number;
  status: number;
  size: number;
  data: Uint8Array;
  skipped: Uint8Array;
  xorFlags: Uint8Array;
  xorBits: Uint8Array;
  encoding: number;
};

export type DmdPlanes = {
  plane0: DmdPlane;
  plane1: DmdPlane;
};

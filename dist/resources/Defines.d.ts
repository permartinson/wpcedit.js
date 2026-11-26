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

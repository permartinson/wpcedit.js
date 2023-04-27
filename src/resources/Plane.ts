export type Plane = {
    width: number;
    height: number;
    image: Uint8Array;
    mask: Uint8Array;
    xor: Uint8Array;
    flags: Uint8Array;
    xOffset: number;
    yOffset: number;
    type: number;
    address: number;
    tableAddress: number;
}
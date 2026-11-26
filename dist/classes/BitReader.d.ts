import { RomReader } from "./RomReader.js";
export declare class BitReader {
    private readonly src;
    private readonly repeatBytes;
    readMask: number;
    constructor(src: RomReader, repeatBytes: number[]);
    get atByteStart(): boolean;
    readBit(): number;
    readValue(): number;
}

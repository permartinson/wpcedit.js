export declare class RomReader {
    pos: number;
    constructor(pos: number);
    peek(offset?: number): number;
    u8(): number;
    skip(count?: number): void;
    get atEnd(): boolean;
}

export declare class Checksum {
    static get stored(): number;
    private static _getRomDelta;
    static get calculated(): number;
    static get delta(): number;
    private static _byteSumOf16bitVal;
    private static _subtractChecksumAndDeltaBytes;
    static disable(): {
        data: Uint8Array;
        status: number;
    };
    static update(version: number, force?: boolean): {
        data: Uint8Array;
        status: number;
    };
    static get isValid(): boolean;
}

export declare class ROM {
    private static instance;
    private static currentData;
    static size: number;
    static startPtr: number;
    static endPtr: number;
    static totalPages: number;
    static basePageIndex: number;
    static vSImageTableMap: number[][];
    private constructor();
    static init(data: Uint8Array): ROM;
    static byteAtAddr(Addr: number): number;
    static setRom(data: Uint8Array): {
        error: boolean;
        msg: string;
    };
    static get data(): Uint8Array;
    static set data(data: Uint8Array);
    static get nonPagedBankAddr(): number;
}

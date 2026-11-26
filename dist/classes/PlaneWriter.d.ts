export declare class PlaneWriter {
    readonly data: Uint8Array;
    private readonly direction;
    private readonly cols;
    private readonly rows;
    pos: number;
    count: number;
    readonly capacity: number;
    constructor(data: Uint8Array, direction: number, cols?: number, rows?: number);
    static fullFrame(direction: number): PlaneWriter;
    get full(): boolean;
    write(value: number): void;
}

export type WpcPointer = {
    addr: number;
    page: number;
};
export declare class DataParser {
    private static instance;
    private constructor();
    static init(): DataParser;
    static initTableAddrs(dataType: number): 0 | -1 | undefined;
    private static skipPointer;
    static getFirstImageIndex(tableIndex: number): number;
    static getNextImageIndex(imageIndex: number, tableIndex: number): number;
    static getLastImageIndex(imageIndex: number, tableIndex: number): {
        last: number;
        indices: number[];
    };
    static getPrevImageIndex(imageIndex: number, tableIndex: number): number;
    private static isValidTableIndex;
    private static getROMAddressOfVariableSizedImageTable;
    static extractWPCAddrAndPageOfImageTable(tableIndex: number): WpcPointer | null;
    private static getROMAddressFromWPCAddrAndPage;
    private static getAddrToWPCAddressOfVariableSizedImageTable;
    static getROMAddressFromAddrOf3ByteWPCAddrPage(src: number): number | null;
    private static getROMAddressFromWPCPointer;
    static getROMAddressOfVariableSizedImageIndex(tableIndex: number, imageIndex: number): number | null;
    private static extractWPCAddrAndPageFromBuffer;
    private static validateWPCPointer;
    private static processHitType;
    static preAnalyzeVariableSizedImageTable(): 0 | -1;
    static getVariableSizedImageTableMetadata(tableIndex: number): {
        height: number;
        spacing: number;
    } | null;
}

export declare class DataParser {
    private static instance;
    private constructor();
    static init(romData: Uint8Array): DataParser;
    static initTableAddrs(dataType: number): 0 | -1 | undefined;
    static getFirstImageIndex(TableIndex: number): number;
    static getNextImageIndex(pImageIndex: number, TableIndex: number): number;
    static getLastImageIndex(pImageIndex: number, TableIndex: number): [number, number[]];
    static getPrevImageIndex(pImageIndex: number, TableIndex: number): number;
    private static getROMAddressOfVariableSizedImageTable;
    static extractWPCAddrAndPageOfImageTable(TableIndex: number): number[];
    private static getROMAddressFromWPCAddrAndPage;
    private static getAddrToWPCAddressOfVariableSizedImageTable;
    static getROMAddressFromAddrOf3ByteWPCAddrPage(pSrc: number): number;
    static getROMAddressOfVariableSizedImageIndex(TableIndex: number, ImageIndex: number): number;
    private static extractWPCAddrAndPageFromBuffer;
    private static processHitType;
    static preAnalyzeVariableSizedImageTable(): 0 | -1;
    static getVariableSizedImageTableMetadata(TableIndex: number): number[];
}

export declare namespace HitTypes {
    const None = 0;
    const AddrAddrAddr = 1;
    const AddrAddr = 2;
    const Addr = 3;
}
export declare namespace WriteTypes {
    const Columns = 0;
    const Rows = 1;
}
export declare namespace ImageCodes {
    const Monochrome = 0;
    const FD = 253;
    const BicolorIndirect = 254;
    const BicolorDirect = 255;
}
export declare namespace DataTypes {
    const Graphics = 1;
    const FontData = 2;
    const AniData = 3;
}
export declare namespace PlaneStatuses {
    const Valid = 0;
    const Invalid = 1;
    const Unknown = 2;
    const Unimplemented = 3;
    const TableEntryOutOfRange = 4;
    const BadDimension = 5;
    const ImageOutOfRange = 6;
}
export declare namespace WPC {
    const DmdRows = 32;
    const DmdCols = 128;
    const DmdPageBytes = 512;
    const PageLength = 16384;
    const BaseCodeAddrPagedRom = 16384;
    const BaseCodeAddrNonpagedRom = 32768;
    const NonpagedLength = 32768;
    const NonpagedBankIndicator = 255;
    const ImageShiftXPixelCount = 8;
    const ImageShiftYPixelCount = 8;
    const ChecksumOffset: number;
    const DeltaOffset: number;
    const ValidEncodings: number[];
}

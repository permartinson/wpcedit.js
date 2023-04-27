export namespace HitTypes { // Rename this to HitType, when the colliding variable name has been renamed in the classes
    export const None = 0;
    export const AddrAddrAddr = 1;
    export const AddrAddr = 2;
    export const Addr = 3;
}

export namespace WriteTypes {
    export const Columns = 0;
    export const Rows = 1;
}

export namespace ImageCodes {
    export const Monochrome = 0x00; // Single color pixel data
    export const FD = 0xfd; // Unsure (maybe inversed paint?) IJ uses.  Use normal header 0x00 processing
    export const BicolorIndirect = 0xfe; // Bi-color pixel data contains one plane and pointer to the other
    export const BicolorDirect = 0xff; // Bi-color pixel data contains both planes
}

export namespace DataTypes {
    export const Graphics = 1;
    export const FontData = 2;
    export const AniData = 3;
}

export namespace PlaneStatuses {
    export const Valid = 0;
    export const Invalid = 1;
    export const Unknown = 2;
    export const Unimplemented = 3;
    export const TableEntryOutOfRange = 4;
    export const BadDimension = 5;
    export const ImageOutOfRange = 6;
}

export namespace WPC {
    export const DmdRows = 32;
    export const DmdCols = 128;
    export const DmdPageBytes = 512; // (DMDRows * DMDCols) / 8
    
    export const PageLength = 0x4000;
    export const BaseCodeAddrPagedRom = 0x4000;
    export const BaseCodeAddrNonpagedRom = 0x8000;
    export const NonpagedLength = 0x8000;
    export const NonpagedBankIndicator = 0xff;
    
    export const ImageShiftXPixelCount = 8;
    export const ImageShiftYPixelCount = 8;

    export const ChecksumOffset = 0xFFEE - 0x8000;
    export const DeltaOffset = 0xFFEC - 0x8000;
    export const ValidEncodings = [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF];
}
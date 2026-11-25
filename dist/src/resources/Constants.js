export var HitTypes;
(function (HitTypes) {
    HitTypes.None = 0;
    HitTypes.AddrAddrAddr = 1;
    HitTypes.AddrAddr = 2;
    HitTypes.Addr = 3;
})(HitTypes || (HitTypes = {}));
export var WriteTypes;
(function (WriteTypes) {
    WriteTypes.Columns = 0;
    WriteTypes.Rows = 1;
})(WriteTypes || (WriteTypes = {}));
export var ImageCodes;
(function (ImageCodes) {
    ImageCodes.Monochrome = 0x00;
    ImageCodes.FD = 0xfd;
    ImageCodes.BicolorIndirect = 0xfe;
    ImageCodes.BicolorDirect = 0xff;
})(ImageCodes || (ImageCodes = {}));
export var DataTypes;
(function (DataTypes) {
    DataTypes.Graphics = 1;
    DataTypes.FontData = 2;
    DataTypes.AniData = 3;
})(DataTypes || (DataTypes = {}));
export var PlaneStatuses;
(function (PlaneStatuses) {
    PlaneStatuses.Valid = 0;
    PlaneStatuses.Invalid = 1;
    PlaneStatuses.Unknown = 2;
    PlaneStatuses.Unimplemented = 3;
    PlaneStatuses.TableEntryOutOfRange = 4;
    PlaneStatuses.BadDimension = 5;
    PlaneStatuses.ImageOutOfRange = 6;
})(PlaneStatuses || (PlaneStatuses = {}));
export var WPC;
(function (WPC) {
    WPC.DmdRows = 32;
    WPC.DmdCols = 128;
    WPC.DmdPageBytes = 512;
    WPC.PageLength = 0x4000;
    WPC.BaseCodeAddrPagedRom = 0x4000;
    WPC.BaseCodeAddrNonpagedRom = 0x8000;
    WPC.NonpagedLength = 0x8000;
    WPC.NonpagedBankIndicator = 0xff;
    WPC.ImageShiftXPixelCount = 8;
    WPC.ImageShiftYPixelCount = 8;
    WPC.ChecksumOffset = 0xFFEE - 0x8000;
    WPC.DeltaOffset = 0xFFEC - 0x8000;
    WPC.ValidEncodings = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF];
})(WPC || (WPC = {}));

import { DataParser } from "./classes/DataParser.js";
import { Settings } from "./stores/Settings.js";
import { VariableSizedImageData } from "./stores/VariableSizedImageData.js";
import { FullFrameImageData } from "./stores/FullFrameImageData.js";
import { VariableSizedImage } from "./classes/VariableSizedImage.js";
import { FullFrameImage } from "./classes/FullFrameImage.js";
import { ROM } from "./stores/ROM.js";
import { DataTypes } from "./resources/Constants.js";
import { Checksum } from "./classes/Checksum.js";
export class WPCEdit {
    constructor(mode = 1) {
        Settings.DataType = mode;
        Settings.init();
        FullFrameImageData.init();
        VariableSizedImageData.init();
    }
    static init(mode = 1) {
        if (WPCEdit.instance) {
            return this.instance;
        }
        this.instance = new WPCEdit(mode);
        return this.instance;
    }
    static reloadData() {
        let status = { error: false, msg: '' };
        VariableSizedImageData.CurrentImageIndex = 0;
        VariableSizedImageData.CurrentTableIndex = 0;
        VariableSizedImageData.maxImageIndex = 0;
        VariableSizedImageData.maxTableIndex = 0;
        VariableSizedImageData.minImageIndex = 0;
        VariableSizedImageData.minTableIndex = 0;
        if (DataParser.initTableAddrs(DataTypes.FontData) != 0) {
            const msg = "Could not determine data table location in ROM image.";
            console.warn(msg);
            status.error = true;
            status.msg = msg;
        }
        FullFrameImageData.CurrentImageIndex = 0;
        if (DataParser.preAnalyzeVariableSizedImageTable() == -1) {
            const msg = "Error from DataParser.preAnalyzeVariableSizedImageTable()";
            console.warn(msg);
            status.error = true;
            status.msg = msg;
            return status;
        }
        VariableSizedImageData.CurrentTableIndex = VariableSizedImageData.minTableIndex;
        VariableSizedImageData.CurrentImageIndex = DataParser.getFirstImageIndex(VariableSizedImageData.CurrentTableIndex);
        if (VariableSizedImageData.CurrentImageIndex == -1) {
            const msg = "Error setting up first image index.";
            status.error = true;
            status.msg = msg;
            return status;
        }
        return status;
    }
    static setRom(data) {
        const result = ROM.setRom(data);
        let status = { error: false, msg: '' };
        if (!result.error) {
            const reload = this.reloadData();
            if (reload.error) {
                status.error = true;
                status.msg = reload.msg;
                console.warn(status.msg);
            }
        }
        else {
            status.error = true;
            status.msg = result.msg;
            console.warn(status.msg);
        }
        return status;
    }
    static get verbose() {
        return Settings.VerboseMode;
    }
    static set verbose(state) {
        Settings.VerboseMode = state;
    }
}
WPCEdit.fullFrameImage = FullFrameImage.init();
WPCEdit.variableSizedImage = VariableSizedImage.init();
WPCEdit.checksum = Checksum;
;

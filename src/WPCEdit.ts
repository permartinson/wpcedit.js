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
    private static instance: WPCEdit;

    public static fullFrameImage = FullFrameImage.init();
    public static variableSizedImage = VariableSizedImage.init();
    public static checksum = Checksum;

    private constructor() {
        Settings.init();
        FullFrameImageData.init();
        VariableSizedImageData.init();
    }

    public static init() {
        if(WPCEdit.instance) {
            return this.instance;
        }
        this.instance = new WPCEdit();
        return this.instance;
    }

    private static reloadData() {
        let status = {error:false, msg:''}
        // resetting the values to start from scratch:
        VariableSizedImageData.CurrentImageIndex = 0;
        VariableSizedImageData.CurrentTableIndex = 0;
        VariableSizedImageData.maxImageIndex = 0;
        VariableSizedImageData.maxTableIndex = 0;
        VariableSizedImageData.minImageIndex = 0;
        VariableSizedImageData.minTableIndex = 0;

        if (DataParser.initTableAddrs(DataTypes.FontData) != 0) {
            const msg = "Could not determine data table location in ROM image."
            console.warn(msg);
            status.error = true;
            status.msg = msg;
          }
          FullFrameImageData.CurrentImageIndex = 0;
      
                  if (DataParser.preAnalyzeVariableSizedImageTable() == -1) {
                      // PreAnalyzeVariableSizedImageTable() should have printed whatever error caused it to return == -1 value
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

    public static setRom(data: Uint8Array) {
        const result = ROM.setRom(data);
        let status = {error:false,msg:''}

        if(!result.error) {
            const reload = this.reloadData();
            if(reload.error) {
                status.error = true;
                status.msg = reload.msg;
                console.warn(status.msg)
            }
        } else {
            status.error = true;
            status.msg = result.msg;
            console.warn(status.msg)
        }
        return status;
    }

    public static get verbose():boolean {
        return Settings.VerboseMode;
    }

    public static set verbose(state:boolean) {
        Settings.VerboseMode = state;
    }
};
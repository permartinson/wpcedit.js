import { VariableSizedImage } from "./classes/VariableSizedImage.js";
import { FullFrameImage } from "./classes/FullFrameImage.js";
import { Checksum } from "./classes/Checksum.js";
export declare class WPCEdit {
    private static instance;
    static fullFrameImage: FullFrameImage;
    static variableSizedImage: VariableSizedImage;
    static checksum: typeof Checksum;
    private constructor();
    static init(): WPCEdit;
    private static reloadData;
    static setRom(data: Uint8Array): {
        error: boolean;
        msg: string;
    };
    static get verbose(): boolean;
    static set verbose(state: boolean);
}

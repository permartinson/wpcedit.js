import { Settings } from "../stores/Settings.js";

export function toHex(decimal:number) {
    return "0x"+decimal.toString(16);
}

export function logStr(string:string) {
    if(Settings.VerboseMode) {
        console.log(string);
    }
}

export function warnStr(string:string) {
    console.warn(string);
}
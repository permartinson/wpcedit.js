import { Settings } from "../stores/Settings.js";
export function toHex(decimal) {
    return "0x" + decimal.toString(16);
}
export function logStr(string) {
    if (Settings.verboseMode) {
        console.log(string);
    }
}
export function warnStr(string) {
    console.warn(string);
}

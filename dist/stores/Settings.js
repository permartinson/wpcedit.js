export class Settings {
    constructor() {
    }
    static init() {
        if (Settings.instance) {
            return this.instance;
        }
        this.instance = new Settings();
        return this.instance;
    }
}
Settings.VerboseMode = false;
;

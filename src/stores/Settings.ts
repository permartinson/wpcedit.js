export class Settings {
    private static instance: Settings;

    public static VerboseMode: boolean = false;

    private constructor() {
}
    public static init() {
        if(Settings.instance) {
            return this.instance;
        }
        this.instance = new Settings();
        return this.instance;
    }
};
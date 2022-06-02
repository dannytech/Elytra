import { EventEmitter } from "events";
import { Settings, MinecraftConfigs } from "../Configuration";
import * as Colors from "colors/safe";

export class StandardConsole extends EventEmitter {
    private debug: boolean = false;

    constructor() {
        super();
    }

    /**
     * Log to the console.
     * @param {...any} message The message to write to the console.
     */
    public Log(...message: any[]) {
        this.emit("message", ...message);

        // Writes messages to the console if it is currently unblocked
        console.log(message.join(" "));
    }

    public Info(...message: any[]) {
        this.Log(Colors.blue("[INFO]"), ...message);
    }

    public Error(...message: any[]) {
        this.Log(Colors.red("[ERROR]"), ...message);
    }

    public Warn(...message: any[]) {
        this.Log(Colors.yellow("[WARN]"), ...message);
    }

    /**
     * Logs debug messages to the console if debug mode is enabled.
     * @param {...any} message The message to write to the console.
     */
    public async Debug(...message: any[]) {
        const debug: boolean = await Settings.Get(MinecraftConfigs.Debug);
        if (debug)
            this.Log(Colors.green("[DEBUG]"), ...message);
    }
}

export const Console: StandardConsole = new StandardConsole();

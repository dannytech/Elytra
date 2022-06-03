import { EventEmitter } from "events";
import { Settings, MinecraftConfigs } from "../Configuration";

export class StandardConsole extends EventEmitter {
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
        this.Log("[INFO]".black.bgBlue, ...message);
    }

    public Error(...message: any[]) {
        this.Log("[ERROR]".white.bgRed, ...message);
    }

    public Warn(...message: any[]) {
        this.Log("[WARN]".black.bgYellow, ...message);
    }

    /**
     * Logs debug messages to the console if debug mode is enabled.
     * @param {...any} message The message to write to the console.
     */
    public async Debug(...message: any[]) {
        const debug: boolean = await Settings.Get(MinecraftConfigs.Debug);
        if (debug)
            this.Log("[DEBUG]".black.bgGreen, ...message);
    }
}

export const Console: StandardConsole = new StandardConsole();

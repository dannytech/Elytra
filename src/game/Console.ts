import { EventEmitter } from "events";

export class StandardConsole extends EventEmitter {

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
        this.Log("[INFO]", ...message);
    }

    public Error(...message: any[]) {
        this.Log("[ERROR]", ...message);
    }

    public Warn(...message: any[]) {
        this.Log("[WARN]", ...message);
    }
}

export const Console: StandardConsole = new StandardConsole();

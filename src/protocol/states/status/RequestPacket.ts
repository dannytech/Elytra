import { Client } from "../../Client";
import { ServerboundPacket } from "../../Packet";
import { ResponsePacket } from "./ResponsePacket";
import { Console } from "../../../game/Console";

export class RequestPacket extends ServerboundPacket {
    /**
     * Handle requests for server information.
     * @async
     */
    public async Parse() {
        // Generate a response containing server information
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[C → S]".blue, "[RequestPacket]".green,
            "Requesting server information");
        this._Client.Queue(new ResponsePacket(this._Client));
    }
}

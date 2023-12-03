import { ServerboundPacket } from "../../Packet.js";
import { ResponsePacket } from "./ResponsePacket.js";
import { Logging } from "../../../game/Logging.js";

export class RequestPacket extends ServerboundPacket {
    /**
     * Handle requests for server information
     * @async
     */
    public async Parse() {
        // Generate a response containing server information
        Logging.DebugPacket(this, "Requesting server information");
        this._Client.Queue(new ResponsePacket(this._Client));
    }
}

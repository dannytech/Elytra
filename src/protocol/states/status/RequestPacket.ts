import { ServerboundPacket } from "../../Packet";
import { ResponsePacket } from "./ResponsePacket";
import { Logging } from "../../../game/Logging";

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

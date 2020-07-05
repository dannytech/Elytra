import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { ResponsePacket } from "./ResponsePacket";

export class RequestPacket implements IServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    /**
     * Handle requests for server information.
     * @async
     */
    public async Parse() : Promise<boolean> {
        // Generate a response containing server information
        this._Client.Queue(new ResponsePacket());

        return true;
    }
}

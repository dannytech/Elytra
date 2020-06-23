import { Client } from "../../../Client";
import { ServerboundPacket } from "../../Packet";
import { ResponsePacket } from "./ResponsePacket";

export class RequestPacket implements ServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    public async Parse() : Promise<boolean> {
        // Generate a response containing server information
        this._Client.Queue(new ResponsePacket());

        return true;
    }
}

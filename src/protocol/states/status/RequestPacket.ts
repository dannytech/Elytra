import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { ResponsePacket } from "./ResponsePacket";
import { Console } from "../../../game/Console";

export class RequestPacket implements IServerboundPacket {
    private _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Handle requests for server information.
     * @async
     */
    public async Parse() {
        // Generate a response containing server information
        Console.Debug(`(${this._Client.ClientId})`, "[C → S]", "[RequestPacket]", "Requesting server information");
        this._Client.Queue(new ResponsePacket(this._Client));
    }
}

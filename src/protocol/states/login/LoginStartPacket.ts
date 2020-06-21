import { Client } from "../../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";

export class LoginStartPacket implements ServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    public async Parse(buf: ReadableBuffer) : Promise<void> {
        const username: string = buf.ReadVarChar();
        
        this._Client.Queue(new SetCompressionPacket(this._Client));
    }
}
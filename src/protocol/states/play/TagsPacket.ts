import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class TagsPacket implements IClientboundPacket {
    private _Client: Client;

    public PacketID: number = 0x5C;

    constructor(client: Client) {
        this._Client = client;
    }

    public async Write(buf: WritableBuffer): Promise<void> {
        // TODO Add tags
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[TagsPacket]", "Sending dummy tags");
        buf.WriteVarInt(0); // Block tags
        buf.WriteVarInt(0); // Item tags
        buf.WriteVarInt(0); // Fluid tags
        buf.WriteVarInt(0); // Entity tags
    }
}
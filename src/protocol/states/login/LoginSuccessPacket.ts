import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client } from "../../Client";

export class LoginSuccessPacket implements ClientboundPacket {
    private _Client: Client;

    public PacketID: number = 0x02;

    constructor(client: Client) {
        this._Client = client;
    }

    public async Write(buf: WritableBuffer) {
        // Write the player UUID
        buf.WriteVarChar(this._Client.Player.UUID.Format(true));

        // Write the username
        buf.WriteVarChar(this._Client.Player.Username);
    }
}

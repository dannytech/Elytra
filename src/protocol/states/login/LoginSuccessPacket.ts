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
        const hyphenated: string = this._Client.Player.UUID.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
        buf.WriteVarChar(hyphenated);

        // Write the username
        buf.WriteVarChar(this._Client.Player.Username);
    }
}

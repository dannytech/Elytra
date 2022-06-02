import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client } from "../../Client";
import { UUID } from "../../../game/UUID";
import { Console } from "../../../game/Console";

export class LoginSuccessPacket implements IClientboundPacket {
    private _Client: Client;

    public PacketID: number = 0x02;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Tell the client that the login process was successful.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {string} UUID The player's UUID.
     * @property {string} Username The player's username.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Write the player UUID
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[LoginSuccessPacket]", "Sending logged-in UUID");
        const uuid: UUID = this._Client.Player.UUID || UUID.Generate();
        buf.WriteVarChar(uuid.Format(true));

        // Write the username
        buf.WriteVarChar(this._Client.Player.Username);
    }
}

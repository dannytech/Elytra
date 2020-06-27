import * as nconf from "nconf";
import { Constants } from "../../../Configuration";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class ResponsePacket implements IClientboundPacket {
    public PacketID: number = 0x00;

    public async Write(buf: WritableBuffer) {
        // Send back server information
        buf.WriteJSON({
            "version": {
                "name": `${Constants.ServerName} ${Constants.MinecraftVersion}`,
                "protocol": Constants.ProtocolVersion
            },
            "players": {
                "max": nconf.get("server:maximumPlayers"),
                "online": 5,
                "sample": [
                    {
                        "name": "thinkofdeath",
                        "id": "4566e69f-c907-48ee-8d71-d7ba5aa00d20"
                    }
                ]
            },
            "description": {
                "text": nconf.get("server:motd")
            }
        });
    }
}

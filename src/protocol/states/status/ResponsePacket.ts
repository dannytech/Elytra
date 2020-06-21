import * as nconf from "nconf";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Constants } from "../../../Configuration";

export class ResponsePacket implements ClientboundPacket {
    public PacketID: number = 0x00;

    public Write(buf: WritableBuffer) : void {
        // Send back server information
        buf.WriteJSON({
            "version": {
                "name": `${Constants.ServerName} ${Constants.MinecraftVersion}`,
                "protocol": Constants.ProtocolVersion
            },
            "players": {
                "max": nconf.get("maximumPlayers"),
                "online": 5,
                "sample": [
                    {
                        "name": "thinkofdeath",
                        "id": "4566e69f-c907-48ee-8d71-d7ba5aa00d20"
                    }
                ]
            },
            "description": {
                "text": nconf.get("motd")
            }
        });
    }
}

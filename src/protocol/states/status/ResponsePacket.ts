import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Settings } from "../../../Settings";

export class ResponsePacket implements ClientboundPacket {
    public PacketID: number = 0x00;

    public Write(buf: WritableBuffer) : void {
        // Echo back the contents of the ping
        buf.WriteJSON({
            "version": {
                "name": "Elytra 1.15.2",
                "protocol": 578
            },
            "players": {
                "max": 100,
                "online": 5,
                "sample": [
                    {
                        "name": "thinkofdeath",
                        "id": "4566e69f-c907-48ee-8d71-d7ba5aa00d20"
                    }
                ]
            },
            "description": {
                "text": Settings.Config.motd || "An Elytra server"
            }
        });
    }
}

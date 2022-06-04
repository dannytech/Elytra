import { Console } from "../../../game/Console";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { LegacyKickPacket } from "./LegacyKickPacket";

export class LegacyHandshakePacket extends ServerboundPacket {
    public async Parse(buf: ReadableBuffer) {
        // The ping payload should always be 0x01
        const payload: number = buf.ReadByte();

        // The plugin message identifier should always be 0xFA
        const identifier: number = buf.ReadByte();

        // Read the plugin channel string (UTF-16BE), which should always be "MC|PingHost"
        const channelLength: number = buf.ReadUint16() * 2;
        const channel: string = buf.Read(channelLength).swap16().toString("utf16le");

        // The length of the rest of the packet
        const length: number = buf.ReadUint16();

        // The legacy client protocol version (at most 0x4A)
        const protocolVersion: number = buf.ReadByte();

        // The hostname the client is connecting to
        const remainingLength: number = buf.ReadUint16() * 2;

        // There are 7 other bytes which are ignored (14 below because those bytes are not UTF-16 but were doubled above)
        buf.Read(remainingLength - 14).swap16().toString("utf16le");

        // The port the client is connecting to
        buf.ReadUint32();

        // Send a response packet
        if (payload == 0x01 && identifier == 0xFA && channel == "MC|PingHost" && length == remainingLength + 7) {
            Console.DebugPacket(this, "Received legacy ping with protocol version", protocolVersion.toString().green);
            this._Client.Queue(new LegacyKickPacket(this._Client));

            // Send the kick packet containing server information
            this._Client.Send();
        }
    }
}

import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Client, ClientState } from "../Client";
import { HandshakePacket } from "./states/handshaking/HandshakePacket";
import { PingPacket } from "./states/status/PingPacket";
import { RequestPacket } from "./states/status/RequestPacket";
import { LoginStartPacket } from "./states/login/LoginStartPacket";
import { EncryptionResponsePacket } from "./states/login/EncryptionResponsePacket";

export interface ServerboundPacket {
    Parse(buf: ReadableBuffer) : Promise<boolean>;
}

export interface ClientboundPacket {
    PacketID: number;

    Write(buf: WritableBuffer) : Promise<void>;
}

export class PacketFactory {
    static async Parse(buf: ReadableBuffer, client: Client) {
        const packetId = buf.ReadVarInt();

        // Determine the incoming packet identity based on current state and the packet ID
        let packet: ServerboundPacket;
        switch (client.State) {
            case ClientState.Handshaking:
                switch (packetId) {
                    case 0x00:
                        packet = new HandshakePacket(client);
                        break;
                }
                break;
            case ClientState.Status:
                switch (packetId) {
                    case 0x00:
                        packet = new RequestPacket(client);
                        break;
                    case 0x01:
                        packet = new PingPacket(client);
                        break;
                }
                break;
            case ClientState.Login:
                switch (packetId) {
                    case 0x00:
                        packet = new LoginStartPacket(client);
                        break;
                    case 0x01:
                        packet = new EncryptionResponsePacket(client);
                        break;
                }
        }

        // Process the packet and allow it to generate a response
        if (packet) {
            const queued: boolean = await packet.Parse(buf);

            // Dispatch packets if a send is requested
            if (queued) client.Send();
        }
    }
}

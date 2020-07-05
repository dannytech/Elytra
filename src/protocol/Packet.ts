import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Client, ClientState } from "./Client";
import { HandshakePacket } from "./states/handshaking/HandshakePacket";
import { PingPacket } from "./states/status/PingPacket";
import { RequestPacket } from "./states/status/RequestPacket";
import { LoginStartPacket } from "./states/login/LoginStartPacket";
import { EncryptionResponsePacket } from "./states/login/EncryptionResponsePacket";

export interface IServerboundPacket {
    /**
     * Parses the packet, modifying game state and responding as needed.
     * @param {ReadableBuffer} buf The packet contents to parse.
     * @returns {boolean} Whether packets were queued and need to be dispatched to the client.
     * @async
     */
    Parse(buf: ReadableBuffer) : Promise<boolean>;
}

export interface IClientboundPacket {
    PacketID: number;

    /**
     * Writes the packet to a buffer.
     * @param {WritableBuffer} buf The buffer to be sent to the client.
     * @async
     */
    Write(buf: WritableBuffer) : Promise<void>;
}

export class PacketFactory {
    /**
     * Parse a packet, modifying game state and replying as necessary.
     * @param {ReadableBuffer} buf A buffer containing a single packet to parse.
     * @param {Client} client The client from which this packet was received.
     * @static
     * @async
     */
    public static async Parse(buf: ReadableBuffer, client: Client) {
        const packetId = buf.ReadVarInt();

        // Determine the incoming packet identity based on current state and the packet ID
        let packet: IServerboundPacket;
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
                break;
        }

        // Process the packet and allow it to generate a response
        if (packet) {
            const queued: boolean = await packet.Parse(buf);

            // Dispatch packets if a send is requested
            if (queued) client.Send();
        } else
            console.log(`Unrecognized packet with ID 0x${packetId.toString(16).padStart(2, "0")}:`, buf.Buffer);
    }
}

import { parse } from "yaml";
import { readFile } from "fs/promises";

import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Client, ClientState } from "./Client";
import { Console } from "../game/Console";
import { HandshakePacket } from "./states/handshaking/HandshakePacket";
import { PingPacket } from "./states/status/PingPacket";
import { RequestPacket } from "./states/status/RequestPacket";
import { LoginStartPacket } from "./states/login/LoginStartPacket";
import { EncryptionResponsePacket } from "./states/login/EncryptionResponsePacket";
import { ClientPluginMessagePacket } from "./states/play/PluginMessagePacket";
import { TeleportConfirmPacket } from "./states/play/TeleportConfirmPacket";

export interface IServerboundPacket {
    /**
     * Parses the packet, modifying game state and responding as needed.
     * @param {ReadableBuffer} buf The packet contents to parse.
     * @async
     */
    Parse(buf: ReadableBuffer) : Promise<void>;

    AfterReceive?() : Promise<void>;
}

export interface IClientboundPacket {
    /**
     * Writes the packet to a buffer.
     * @param {WritableBuffer} buf The buffer to be sent to the client.
     * @async
     */
    Write(buf: WritableBuffer) : Promise<void>;

    AfterSend?() : Promise<void>;
}

export class PacketFactory {
    private _PacketSpec: {
        [key: string]: {
            [key: string]: number | {
                [key: number]: number;
            }
        }
    };

    /**
     * Loads the packet specification from a YAML file.
     * @async
     */
    public async Load() {
        const spec: string = await readFile("./src/protocol/packets.yml", "utf8");
        this._PacketSpec = parse(spec);
    }

    /**
     * Convert from a packet name to the corresponding version-specific packet ID
     * @param {ClientState} state The client state to use for the lookup.
     * @param {string} packetName The name of the packet to convert.
     * @returns {number} The packet ID.
     */
    public Lookup(client: Client, packetName: string) : number {
        const statePackets = this._PacketSpec[client.State];

        if (statePackets.hasOwnProperty(packetName)) {
            const packetId = statePackets[packetName];

            if (typeof packetId === "number")
                return packetId;
            else {
                // Get a reverse-ordered (latest first) list of the changes to the packet ID
                const versions: number[] = Object.keys(packetId).map(Number);
                versions.sort().reverse();

                // Find the latest version change the client is compatible with
                for (const version of versions) {
                    if (client.ProtocolVersion >= version)
                        return packetId[version];
                }
            }
        }
        Console.Error(`Unable to resolve packet ID for ${packetName.green}, please report this to the developer`);
    }

    /**
     * Parse a packet, modifying game state and replying as necessary.
     * @param {ReadableBuffer} buf A buffer containing a single packet to parse.
     * @param {Client} client The client from which this packet was received.
     * @static
     * @async
     */
    public async Parse(buf: ReadableBuffer, client: Client) {
        const packetId: number = buf.ReadVarInt();

        // Determine the incoming packet identity based on current state and the packet ID
        let packet: IServerboundPacket;
        switch (client.State) {
            case ClientState.Handshaking:
                switch (packetId) {
                    case this.Lookup(client, HandshakePacket.name):
                        packet = new HandshakePacket(client);
                        break;
                }
                break;
            case ClientState.Status:
                switch (packetId) {
                    case this.Lookup(client, RequestPacket.name):
                        packet = new RequestPacket(client);
                        break;
                    case this.Lookup(client, PingPacket.name):
                        packet = new PingPacket(client);
                        break;
                }
                break;
            case ClientState.Login:
                switch (packetId) {
                    case this.Lookup(client, LoginStartPacket.name):
                        packet = new LoginStartPacket(client);
                        break;
                    case this.Lookup(client, EncryptionResponsePacket.name):
                        packet = new EncryptionResponsePacket(client);
                        break;
                }
                break;
            case ClientState.Play:
                switch (packetId) {
                    case this.Lookup(client, ClientPluginMessagePacket.name):
                        packet = new ClientPluginMessagePacket(client);
                        break;
                    case this.Lookup(client, TeleportConfirmPacket.name):
                        packet = new TeleportConfirmPacket(client);
                        break;
                }
        }

        // Process the packet and allow it to generate a response
        if (packet) {
            await packet.Parse(buf);

            // Activate post-receive hooks
            if (packet.AfterReceive)
                await packet.AfterReceive();

            // Dispatch packets if a send is needed
            client.Send();
        } else
            Console.Debug(`(${client.ClientId})`.magenta, "[C → S]".blue, "[PacketFactory]".green,
                "Unrecognized packet", `0x${packetId.toString(16).padStart(2, "0")}`.green,
                buf.Read().toString("hex").blue);
    }
}

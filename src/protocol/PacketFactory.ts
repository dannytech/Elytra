import { parse } from "yaml";
import { readFile } from "fs/promises";

import { Client, ClientState } from "./Client";
import { Console } from "../game/Console";
import { ReadableBuffer } from "./ReadableBuffer";
import { ServerboundPacket } from "./Packet";
import { HandshakePacket } from "./states/handshaking/HandshakePacket";
import { PingPacket } from "./states/status/PingPacket";
import { RequestPacket } from "./states/status/RequestPacket";
import { LoginStartPacket } from "./states/login/LoginStartPacket";
import { EncryptionResponsePacket } from "./states/login/EncryptionResponsePacket";
import { ClientPluginMessagePacket } from "./states/play/PluginMessagePacket";
import { TeleportConfirmPacket } from "./states/play/TeleportConfirmPacket";
import { ClientSettingsPacket } from "./states/play/ClientSettingsPacket";
import { ClientKeepAlivePacket } from "./states/play/KeepAlivePacket";
import { checkVersion, VersionSpec } from "../Masking";

export enum PacketDirection {
    Serverbound = "serverbound",
    Clientbound = "clientbound"
}

interface VersionedMapping {
    [id: number]: [{
        version: VersionSpec,
        id: number
    }];
}

interface PacketSpec {
    direction: PacketDirection;
    state: ClientState;
    names: string[];
    mappings: VersionedMapping;
}

export class PacketFactory {
    private _PacketSpec: PacketSpec[] = [];

    /**
     * Loads the packet specification from a YAML file.
     * @async
     */
    public async Load() {
        // Load the packet mappingss
        const packets: string = await readFile("./src/protocol/packets.yml", "utf8");
        const def: any = parse(packets);

        // Parse the packet names/IDs into a versioned lookup table
        for (const direction of Object.values(PacketDirection))
            for (const state in def[direction])
                this._LoadPacketSpec(direction as PacketDirection, state as ClientState, def[direction][state]);
    }

    private _LoadPacketSpec(direction: PacketDirection, state: ClientState, def: any) {
        const spec: PacketSpec = {
            direction: direction,
            state: state,
            names: [],
            mappings: {}
        };

        Object.entries(def).forEach(([packetName, packetId]) => {
            const index: number = spec.names.push(packetName) - 1;

            // Dynamically set the direction of the search
            let query: number;
            let result: number;
            if (direction == PacketDirection.Serverbound)
                result = index;
            else
                query = index;

            if (typeof packetId == "number") {
                // If serverbound, the search is done by packet ID, otherwise the packet ID is the result
                if (direction == PacketDirection.Serverbound) {
                    query = packetId as number;
                } else
                    result = packetId as number;

                // Add a mapping from the packet ID to the packet name (by index)
                spec.mappings[query] = [{ version: { start: 0 }, id: result }];
            } else {
                // Find all the packet ID versions (list them in reverse so that range can be set from the upper end)
                const versions: number[] = Object.keys(packetId).map(Number);
                versions.sort().reverse();

                // Iterate through all the versions and add a mapping for each
                versions.reduce((previousVersion, currentVersion) => {
                    const currentId: number = (packetId as any)[currentVersion];

                    // Allow for packets to be removed in later versions (set an upper limit on the previous version)
                    if (currentId == null)
                        return currentVersion;

                    // Generate the version specification matching the given range (either open-ended or at the end of the previous range)
                    const currentSpec: VersionSpec = { start: currentVersion };
                    if (previousVersion)
                        currentSpec.end = previousVersion - 1;

                    // If serverbound, the search is done by packet ID, otherwise the packet ID is the result
                    if (direction == PacketDirection.Serverbound)
                        query = currentId;
                    else
                        result = currentId;

                    // Create a mapping for the current version
                    const mapping: { version: VersionSpec, id: number } = {
                        version: currentSpec,
                        id: result
                    };

                    // Set or add the mapping to the packet ID
                    if (!(query in spec.mappings))
                        spec.mappings[query] = [mapping];
                    else {
                        spec.mappings[query].push(mapping);
                    }

                    return currentVersion;
                }, null);
            }
        });

        // Add the compiled specification
        this._PacketSpec.push(spec);
    }

    /**
     * Convert from a packet name to the corresponding version-specific packet ID
     * @param {ClientState} state The client state to use for the lookup.
     * @param {string|number} packetNameOrId The name of the packet to convert.
     * @returns {string|number} The packet ID.
     */
    public Lookup(direction: "serverbound" | "clientbound", client: Client, packetNameOrId: string | number) : string | number {
        // Load the mappings for the current state
        const statePackets = this._PacketSpec.find(spec => spec.direction == direction && spec.state == client.State);

        // Get the packet ID or index to search for
        let search: number;
        if (direction == "serverbound")
            search = packetNameOrId as number;
        else
            search = statePackets.names.indexOf(packetNameOrId as string);

        // Get the result of the search
        const query: any[] = statePackets.mappings[search];

        // Find a matching version specification
        for (const mapping of query) {
            if (checkVersion(client.ProtocolVersion, [mapping.version])) {
                if (direction == "serverbound")
                    return mapping.id;
                else
                    return statePackets.names[mapping.id];
            }
        }
        Console.Error("Unable to resolve", direction.green, "packet for", packetNameOrId.toString().blue, "(please report this to the developer)");
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
        let packet: ServerboundPacket;
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
                    case this.Lookup(client, ClientSettingsPacket.name):
                        packet = new ClientSettingsPacket(client);
                        break;
                    case this.Lookup(client, TeleportConfirmPacket.name):
                        packet = new TeleportConfirmPacket(client);
                        break;
                    case this.Lookup(client, ClientPluginMessagePacket.name):
                        packet = new ClientPluginMessagePacket(client);
                        break;
                    case this.Lookup(client, ClientKeepAlivePacket.name):
                        packet = new ClientKeepAlivePacket(client);
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
            Console.Debug(`(${client.ClientId})`.magenta, "Unrecognized", client.State.green, "packet",
                `0x${packetId.toString(16).padStart(2, "0")}`.blue, buf.Read().toString("hex").yellow);
    }
}

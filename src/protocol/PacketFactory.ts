import { parse } from "yaml";
import { readFile } from "fs/promises";
import { Client, ClientState } from "./Client";
import { Logging } from "../game/Logging";
import { ReadableBuffer } from "./ReadableBuffer";
import { ServerboundPacket, IServerboundConstructor } from "./Packet";
import { checkVersion, versionSpec, VersionSpec } from "../Masking";
import { Schema } from "joi";
import * as joi from "joi";

export enum PacketDirection {
    Serverbound = "serverbound",
    Clientbound = "clientbound"
}

type PacketMapping = {
    [id: number]: [{
        version: VersionSpec,
        id: number
    }];
};

type PacketMappings = {
    direction: PacketDirection;
    state: ClientState;
    names: string[];
    classes?: Map<string, IServerboundConstructor>;
    mappings: PacketMapping;
};

type SourcePacketMapping = {
    [name: string]: number | {
        [versionSpec: string]: number
    }
};
type SourceStateMapping = {
    [key in PacketDirection]: {
        [key in ClientState]: SourcePacketMapping
    }
};

const SourcePacketMappingSchema = joi.object().pattern(/^[a-zA-Z]+$/, joi.alternatives(
    joi.number(),
    joi.object().pattern(/^\d{0,3}-\d{0,3}$/, joi.number()).min(2)
));
const SourceStateMappingSchema = joi.object().pattern(/^(handshaking|status|login|play)$/, SourcePacketMappingSchema.min(1));

export class PacketFactory {
    private static _Schema: Schema = joi.object({
        serverbound: SourceStateMappingSchema,
        clientbound: SourceStateMappingSchema
    });

    private static _PacketSpec: PacketMappings[] = [];

    /**
     * Loads the packet specification from a YAML file
     * @async
     */
    public static async Load() {
        // Load the packet mappingss
        const packets: string = await readFile("./src/protocol/packets.yml", "utf8");
        const mappings: SourceStateMapping = parse(packets);

        // Validate with Joi
        await PacketFactory._Schema.validateAsync(mappings);

        // Parse the packet names/IDs into a versioned lookup table
        for (const direction of Object.values(PacketDirection))
            for (const state in mappings[direction]) {
                const def: SourcePacketMapping = mappings[direction][state as ClientState];

                Logging.Debug(`Loading ${direction.green} packets for ${state.blue} state`);
                await this._LoadPacketSpec(direction as PacketDirection, state as ClientState, def);
            }
    }

    /**
     * Build a forward and reverse lookup table for packet IDs and names
     * @param direction The packet direction to construct the mapping for
     * @param state The client state to construct the mapping for
     * @param def The raw mapping for the above states to process
     */
    private static async _LoadPacketSpec(direction: PacketDirection, state: ClientState, def: SourcePacketMapping) {
        const spec: PacketMappings = {
            direction: direction,
            state: state,
            names: [],
            mappings: {}
        };

        // For serverbound mappings, cache the packet classes
        if (direction == PacketDirection.Serverbound)
            spec.classes = new Map();

        // Create a mapping for each packet
        for (const packetName of Object.keys(def)) {
            // Extract the packet ID or an array of version specifications mapped to packet IDs
            const packetId = def[packetName];

            // Store the packet name in an array later used to load the packet
            const index: number = spec.names.push(packetName) - 1;

            // Dynamically set the direction of the search
            let query: number;
            let result: number;
            if (direction == PacketDirection.Serverbound) {
                result = index;

                // Load the packet class
                const packetClass = await import(`./states/${state}/${packetName}`);

                // Cache the packet class for faster loading
                if (packetName in packetClass)
                    spec.classes.set(packetName, packetClass[packetName]);
            } else
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
                const versions: string[] = Object.keys(packetId);
                versions.sort((a: string, b: string) => {
                    // Sort only by the start of the range for simplicity
                    const aStart = Number(a.split("-")[0]);
                    const bStart = Number(b.split("-")[0]);

                    // Reverse sort (high to low)
                    return bStart - aStart;
                });

                // Iterate through all the versions and add a mapping for each
                versions.reduce((previousVersion: number, currentVersion: string) => {
                    const currentId: number = packetId[currentVersion];

                    // Allow for packets to be removed in later versions (set an upper limit on the previous version)
                    if (currentId == null)
                        return currentVersion;

                    // Generate the version specification matching the given range (either open-ended or at the end of the previous range)
                    let currentSpec: VersionSpec;
                    if (previousVersion)
                        currentSpec = versionSpec(currentVersion, previousVersion - 1);
                    else currentSpec = versionSpec(currentVersion);

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

                    return currentSpec.start;
                }, null);
            }
        }

        // Add the compiled specification
        this._PacketSpec.push(spec);
    }

    /**
     * Convert from a packet name to the corresponding version-specific packet ID
     * @param {PacketDirection} direction The direction of the packet
     * @param {Client} client The client connecting, used to determine state and protocol version
     * @param {string|number} packetNameOrId The name of the packet to convert
     * @returns {string|number} The packet ID
     */
    public static Lookup(direction: PacketDirection, client: Client, packetNameOrId: string | number): string | number {
        // Load the mappings for the current state
        const statePackets = this._PacketSpec.find(spec => spec.direction == direction && spec.state == client.Protocol.state);

        if (statePackets) {
            // Get the packet ID or index to search for
            let search: number;
            if (direction == PacketDirection.Serverbound)
                search = packetNameOrId as number;
            else
                search = statePackets.names.indexOf(packetNameOrId as string);

            // Get the result of the search
            const result = statePackets.mappings[search];

            // Find a matching version specification
            if (result) {
                for (const mapping of result) {
                    if (checkVersion(client.Protocol.version || 0, [mapping.version])) {
                        if (direction == PacketDirection.Serverbound)
                            return statePackets.names[mapping.id];
                        else
                            return mapping.id;
                    }
                }
            }
        }

        let diagnosticName: string;
        if (direction == PacketDirection.Serverbound) {
            const packetId = packetNameOrId as number;
            diagnosticName = `0x${packetId.toString(16).padStart(2, "0")}`;
        } else
            diagnosticName = packetNameOrId as string;
        Logging.Error("Unable to resolve", direction.green, client.Protocol.state.green, "packet", diagnosticName.blue, "(please report this to the developer)");
    }

    /**
     * Parse a packet, modifying game state and replying as necessary
     * @param {ReadableBuffer} buf A buffer containing a single packet to parse
     * @param {Client} client The client from which this packet was received
     * @static
     * @async
     */
    public static async Parse(buf: ReadableBuffer, client: Client) {
        const packetId: number = buf.ReadVarInt("Packet ID");

        // Load the mappings for the current state
        const statePackets = this._PacketSpec.find(spec => spec.direction == PacketDirection.Serverbound && spec.state == client.Protocol.state);

        // Determine the incoming packet identity based on current state and the packet ID
        const packetName: string = this.Lookup(PacketDirection.Serverbound, client, packetId) as string;
        const packetClass: IServerboundConstructor = statePackets.classes.get(packetName);

        if (packetClass) {
            // Assemble a new object reflectively
            const packet: ServerboundPacket = Reflect.construct(packetClass, [client]);

            await packet.Parse(buf);

            // If tracing is enabled, log the annotated packet contents
            Logging.TracePacket(packet, "Packet:", buf.Buffer.toString("hex"), ...buf.Ranges.map(range => {
                const [buffer, annotation] = range;

                return `\n\t${annotation || "Fragment"}: ${buffer.toString("hex").green}`;
            }));

            // Activate post-receive hooks
            if (packet.AfterReceive)
                await packet.AfterReceive();

            // Dispatch packets if a send is needed
            await client.Send();
        } else
            Logging.Debug(`(${client.Protocol.clientId})`.magenta, "Unrecognized", client.Protocol.state.green, "packet",
                `0x${packetId.toString(16).padStart(2, "0")}`.blue, buf.Buffer.toString("hex").yellow);
    }
}

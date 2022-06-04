import { Console } from "../../../game/Console";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

enum CommandFlags {
    TypeRoot = 0x00,
    TypeLiteral = 0x01,
    TypeArgument = 0x02,
    TypeNone = 0x03,
    Executable = 0x04,
    Redirect = 0x08,
    Suggestions = 0x10
}

type BrigadierNumber = {
    flags: number,
    min?: number,
    max?: number
};

type BrigadierBigint = {
    flags: number,
    min?: bigint,
    max?: bigint
};

enum BrigadierString {
    SINGLE_WORD = 0,
    QUOTABLE_PHRASE = 1,
    GREEDABLE_PHRASE = 2
}

type MinecraftEntity = number;

type MinecraftScoreHolder = number;

type MinecraftRange = boolean;

type MinecraftResourceOrTag = string;

type MinecraftResource = string;

type CommandNode = {
    flags: number; // byte flags
    children: number[]; // indices of the children
    redirect?: number; // index of the redirect (optional)
    name?: string; // the name of the command (optional except for literal and argument nodes)
    parser?: string; // identifier for argument parsers (optional)
    properties?: BrigadierNumber | BrigadierBigint | BrigadierString |
        MinecraftEntity | MinecraftScoreHolder | MinecraftRange |
        MinecraftResourceOrTag | MinecraftResource; // properties for the argument parser (optional)
    suggestions?: string; // identifier for suggestions type (optional)
};

export class DeclareCommandsPacket extends ClientboundPacket {
    /**
     * Tell the client which commands are available.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} CommandCount The number of commands to send.
     * @property {CommandNode[]} Commands The commands to send.
     * @property {number} RootIndex The index of the root command.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // TODO Add commands
        Console.DebugPacket(this, "Sending dummy commands");

        // Command graph
        const nodes: CommandNode[] = [];

        // Add a root node
        nodes.push({
            flags: CommandFlags.TypeRoot,
            children: []
        });

        // Write the number of total nodes
        buf.WriteVarInt(nodes.length);

        nodes.forEach((node: CommandNode) => {
            // Write the flags
            buf.WriteByte(node.flags);

            // Write the children indices
            buf.WriteVarInt(node.children.length);
            node.children.forEach((child: number) => {
                buf.WriteVarInt(child);
            });

            // TODO Add other node properties
        });

        // Index of the root node
        buf.WriteVarInt(0);
    }
}
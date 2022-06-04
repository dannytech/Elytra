import { MinecraftConfigs, Settings, State } from "../../../Configuration";
import { Player } from "../../../game/Player";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class LegacyKickPacket extends ClientboundPacket {
    public async Write(buf: WritableBuffer) {
        // Legacy chat formatted MOTD
        let motd: string = await Settings.Get(MinecraftConfigs.MOTD);
        motd = motd.replace(/&/g, "§");

        // Server metadata
        const onlinePlayers: Player[] = State.ClientBus.OnlinePlayers();
        const maxPlayers: number = await Settings.Get(MinecraftConfigs.MaximumPlayers);

        const message: string[] = [
            "§1",
            "\x00",
            "47", // Reserved protocol version to indicate this server is too new
            "\x00",
            "1.4.2",
            "\x00",
            motd,
            "\x00",
            onlinePlayers.length.toString(),
            "\x00",
            maxPlayers.toString()
        ];

        // Write the kick message
        message.map(part => {
            // Convert each part to UTF-16BE and write it to the buffer
            buf.Write(Buffer.from(part, "utf16le").swap16());
        });

        // Prepend the message length
        buf.Prepend().WriteUint16(buf.Buffer.length / 2);
    }
}
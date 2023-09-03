import { Logging } from "../../../game/Logging";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";

enum ChatMode {
    Enabled = 0,
    CommandsOnly = 1,
    Hidden = 2
}

enum SkinParts {
    Cape = 0x01,
    Jacket = 0x02,
    LeftSleeve = 0x04,
    RightSleeve = 0x08,
    LeftPants = 0x10,
    RightPants = 0x20,
    Hat = 0x40
}

export class ClientSettingsPacket extends ServerboundPacket {
    /**
     * Processes client settings
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {string} Locale The language code
     * @property {string} ViewDistance The client view distance
     * @property {string} ChatMode The chat mode
     * @property {string} ChatColors Whether chat colors are enabled
     * @property {string} DisplayedSkinParts The skin parts which should be displayed
     * @property {string} MainHand Whether the main hand is enabled
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Set the locale for manual translation, if needed (e.g. en_GB)
        const locale: string = buf.ReadVarChar("Locale");
        this.Client.Locale = locale;

        buf.ReadVarInt("View Distance (dummy)");
        buf.ReadVarInt("Chat Mode (dummy)");
        buf.ReadBool("Chat Colors Flag (dummy)");
        buf.ReadByte("Displayed Skin Flags (dummy)");
        buf.ReadVarInt("Main Hand (dummy)");
        Logging.DebugPacket(this, "Received client settings");
    }
}

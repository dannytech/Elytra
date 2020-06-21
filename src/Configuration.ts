import * as nconf from "nconf";

export class Settings {
    public static Load() {
        nconf.env()
            .file("config.json")
            .defaults({
                server: {
                    ip: "0.0.0.0",
                    port: 25565
                },
                api: {
                    ip: "127.0.0.1",
                    port: 25575
                },
                online: true,
                maximumPlayers: 20,
                motd: "An Elytra server"
            });
    }
}

export class Constants {
    public static ServerName = "Elytra";
    public static MinecraftVersion = "1.15.2";
    public static ProtocolVersion = 578;
    public static CompressionThreshold: number = 64;
}

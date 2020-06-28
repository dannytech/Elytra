import * as nconf from "nconf";
import { Keypair } from "./protocol/Encryption";
import { ClientBus } from "./protocol/ClientBus";

export class Settings {
    public static Load() {
        nconf.file("config.json")
            .defaults({
                server: {
                    ip: "0.0.0.0",
                    port: 25565,
                    online: true,
                    preventProxy: true,
                    maximumPlayers: 20,
                    motd: "An Elytra server"
                },
                api: {
                    ip: "127.0.0.1",
                    port: 25575
                }
            })
            .required([
                "database"
            ]);
    }
}

export class State {
    public static Keypair: Keypair;
    public static ClientBus: ClientBus;
}

export class Constants {
    public static ServerName: string = "Elytra";
    public static MinecraftVersion: string = "1.15.2";
    public static ProtocolVersion: number = 578;
    public static CompressionThreshold: number = 64;
    public static KeyLength: number = 1024;
    public static VerificationTokenLength: number = 8;
}

import * as fs from "fs";
import * as yaml from "js-yaml";

interface Configuration {
    server?: {
        ip?: string,
        port?: number
    };

    api?: {
        ip?: string,
        port?: number
    };

    online?: boolean;

    motd?: string;
}

export class Settings {
    public static Config: Configuration;

    public static async Load() {
        return new Promise((resolve, reject) => {
            // Load the file, assuming it's there
            fs.readFile("./config.yml", {
                encoding: "utf-8"
            }, (err, data: string) => {
                if (err) reject(err);

                // Map the config file to the internal config variables
                Settings.Config = yaml.safeLoad(data);

                resolve();
            });
        });
    }
}

export class Constants {
    public static CompressionThreshold: number = 64;
}

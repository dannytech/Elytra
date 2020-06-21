import { Server } from "net";
import { ClientBus } from "./src/ClientBus";
import { Settings } from "./src/Settings";

async function startListener() {
    const server = new Server();
    const bus = new ClientBus();
    
    server.listen(Settings.Config.server.port || 25565, Settings.Config.server.ip || "0.0.0.0", () => {
        console.log("Server started");
    });

    bus.HandleConnections(server);
}

async function startConsole() {

}

(async () => {
    await Settings.Load();

    await startListener();

    await startConsole();
})();

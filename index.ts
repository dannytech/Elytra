import { Server } from "net";
import { ClientBus } from "./src/ClientBus";
import { Settings } from "./src/Configuration";
import * as nconf from "nconf";

async function startListener() {
    const server = new Server();
    const bus = new ClientBus();
    
    server.listen(nconf.get("server:port"), nconf.get("server:ip"), () => {
        console.log("Server started");
    });

    bus.HandleConnections(server);
}

async function startConsole() {

}

(async () => {
    Settings.Load();

    await startListener();

    await startConsole();
})();

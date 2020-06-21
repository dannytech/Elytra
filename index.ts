import { Server } from "net";
import { ClientBus } from "./src/ClientBus";

const port = 25565;

async function startListener() {
    const server = new Server();
    const bus = new ClientBus();
    
    server.listen(port, () => {
        console.log("Server started")
    });

    bus.HandleConnections(server);
}

async function startConsole() {

}

(async () => {
    await startListener();

    await startConsole();
})();

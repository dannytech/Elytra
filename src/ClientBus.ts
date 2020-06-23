import { Socket, Server } from "net";
import { Client } from "./Client";
import { ReadableBuffer } from "./protocol/ReadableBuffer";

export class ClientBus {
    private _Clients: Array<Client>;
    private _Counter: number;
    
    constructor() {
        this._Clients = new Array<Client>();
        this._Counter = 0;
    }

    public async HandleConnections(server: Server) {
        server.on("connection", (socket: Socket) => {
            const client: Client = this.Connect(socket);

            // On a disconnection, purge the client object from the bus
            client.once("disconnected", () => this.Remove(client));

            // Process incoming packets
            socket.on("data", (chunk: Buffer) => {
                const buf: ReadableBuffer = new ReadableBuffer(chunk);

                client.emit("receive", buf);
            });
    
            // Handle errors and disconnects
            socket.once("end", () => {
                client.emit("disconnect");
            });
            socket.on("error", () => {
                client.emit("disconnect");
            });
        });
    }

    public Connect(socket: Socket) : Client {
        // Create a new client wrapper and add it to the server state
        const client = new Client(socket, this._Counter++);
        this._Clients.push(client);

        return client;
    }

    public Remove(client: Client) : void {
        // Remove the client from the server state
        this._Clients.splice(this._Clients.indexOf(client), 1);
    }

    public DisconnectAll() : void {
        // Loop in reverse, telling each client to disconnect and detach
        for (let i: number; i = this._Clients.length - 1; i--) {
            this._Clients[i].emit("disconnect");
        }
    }
}
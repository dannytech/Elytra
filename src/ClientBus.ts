import { Socket, Server } from "net";
import { Client } from "./Client";
import { ReadableBuffer } from "./protocol/ReadableBuffer";

export class ClientBus {
    private _Clients: Array<Client>;
    private _Counter: number;
    
    constructor() {
        this._Clients = new Array<Client>();
        this._Counter += 1;
    }

    public async HandleConnections(server: Server) : Promise<void> {
        server.on("connection", (socket: Socket) => {
            const client: Client = this.Connect(socket);

            // Process incoming packets
            socket.on("data", async (chunk: Buffer) => {
                const buf: ReadableBuffer = new ReadableBuffer(chunk);

                await client.Receive(buf);
            });
    
            // Handle errors and disconnects
            socket.on("end", () => {
                this.Disconnect(client);
            });
            socket.on("error", () => {
                this.Disconnect(client);
            });
        });
    }

    public Connect(socket: Socket) : Client {
        // Create a new client wrapper and add it to the server state
        const client = new Client(socket, this._Counter++);
        this._Clients.push(client);

        return client;
    }

    public Disconnect(client: Client) : void {
        this._Clients.filter(cur => cur.ClientId !== client.ClientId); // Remove the client from the server state

        client.Disconnect(); // Terminate the connection
    }

    public DisconnectAll() : void {
        this._Clients.forEach((client: Client) => this.Disconnect(client));
    }
}
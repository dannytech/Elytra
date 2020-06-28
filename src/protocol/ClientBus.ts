import { Socket, Server } from "net";
import { Client } from "./Client";
import { ReadableBuffer } from "./ReadableBuffer";

export class ClientBus {
    private _Server: Server;
    private _Counter: number;
    
    public Clients: Array<Client>;

    constructor(server: Server) {
        this._Server = server;
        this._Counter = 0;

        this.Clients = new Array<Client>();

        // Attach a connection listener
        this._Server.on("connection", this._HandleConnection.bind(this));
    }

    private async _HandleConnection(socket: Socket) {
        const client: Client = this._Connect(socket);

        // On a disconnection, purge the client object from the bus
        client.once("disconnected", this._Remove.bind(this, client));

        // Process incoming packets
        socket.on("data", (chunk: Buffer) => {
            const buf: ReadableBuffer = new ReadableBuffer(chunk);

            client.Receive(buf);
        });

        // Handle errors and disconnects
        socket.once("end", client.Disconnect.bind(client));
        socket.once("error", client.Disconnect.bind(client));
    }

    private _Connect(socket: Socket) : Client {
        // Create a new client wrapper and add it to the server state
        const client = new Client(socket, this._Counter++);
        this.Clients.push(client);

        return client;
    }

    private _Remove(client: Client) : void {
        // Remove the client from the server state
        this.Clients.splice(this.Clients.indexOf(client), 1);
    }

    public Stop() : void {
        // Stop accepting new clients
        this._Server.close();

        // Loop in reverse, telling each client to disconnect and detach
        for (let i: number; i = this.Clients.length - 1; i--) {
            this.Clients[i].Disconnect();
        }
    }
}
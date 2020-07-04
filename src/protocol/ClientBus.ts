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

    /**
     * Bootstrap a client to send and receive packets.
     * @param {Socket} socket A reference to the TCP socket connection.
     * @async
     */
    private async _HandleConnection(socket: Socket) {
        const client: Client = new Client(socket, this._Counter++);
        this.Clients.push(client);

        // On a disconnection, purge the client object from the bus
        client.once("disconnected", () => {
            this.Clients.splice(this.Clients.indexOf(client), 1);
        });

        // Process incoming packets
        socket.on("data", (chunk: Buffer) => {
            const buf: ReadableBuffer = new ReadableBuffer(chunk);

            client.Receive(buf);
        });

        // Handle errors and disconnects
        socket.once("end", client.Disconnect.bind(client));
        socket.once("error", client.Disconnect.bind(client));
    }

    /**
     * Close down the server, disconnecting clients and refusing incoming connections.
     */
    public Stop() {
        // Stop accepting new clients
        this._Server.close();

        // Loop in reverse, telling each client to disconnect and detach
        for (let i: number; i = this.Clients.length - 1; i--) {
            this.Clients[i].Disconnect();
        }
    }
}
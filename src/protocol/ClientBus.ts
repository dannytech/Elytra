import { Socket, Server } from "net";
import { Client } from "./Client";
import { ClientboundPacket } from "./Packet";
import { ReadableBuffer } from "./ReadableBuffer";

export class ClientBus {
    private _Server: Server;
    private _ClientCounter: number;

    public Clients: Array<Client>;

    constructor(server: Server) {
        this._Server = server;
        this._ClientCounter = 0;

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
        const client: Client = new Client(socket, this._ClientCounter++);
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
     * Send one or more packets to all clients.
     * @param {function} callback A callback to generate per-client packets.
     */
    public async Broadcast(callback: (client: Client) => ClientboundPacket[]) {
        return new Promise<void>((resolve) => {
            this.Clients.forEach(async (client: Client) => {
                const packets = callback(client);

                // Enqueue all broadcasted packets
                if (packets && packets.length > 0) {
                    packets.forEach((packet: ClientboundPacket) => {
                        client.Queue(packet);
                    });

                    // Send all queued packets
                    await client.Send();
                }

                resolve();
            });
        });
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
import { Socket, Server } from "net";
import { Constants } from "../Configuration";
import { Player } from "../game/Player";
import { Client, ClientState } from "./Client";
import { ReadableBuffer } from "./ReadableBuffer";
import { ServerKeepAlivePacket } from "./states/play/ServerKeepAlivePacket";
import { PlayerInfoActions, PlayerInfoPacket } from "./states/play/PlayerInfoPacket";

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

        // Send and check for keepalives
        setInterval(() => {
            this.Broadcast((client: Client) => {
                if (client.State == ClientState.Play) {
                    // If the client keepalive has expired, disconnect it uncleanly
                    if (client.KeepAlive?.last && Date.now() - client.KeepAlive.last > 20000)
                        client.Disconnect();
                    else
                        client.Queue(new ServerKeepAlivePacket(client));
                }
            });
        }, Constants.KeepAliveInterval);

        // Send regular client latency updates
        setInterval(() => {
            this.Broadcast((client: Client) => {
                if (client.State == ClientState.Play) {
                    client.Queue(new PlayerInfoPacket(client, PlayerInfoActions.UpdateLatency, this.OnlinePlayers()));
                }
            });
        }, Constants.KeepAliveInterval * 2);
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
    public async Broadcast(callback: (client: Client) => void) {
        return new Promise<void>((resolve) => {
            this.Clients.forEach(async (client: Client) => {
                callback(client);

                // Send any queued packets
                await client.Send();

                resolve();
            });
        });
    }

    /**
     * Get a list of all players currently online.
     * @returns {Player[]} A list of all players currently online.
     */
    public OnlinePlayers() : Player[] {
        return this.Clients.reduce((players: Player[], client: Client) => {
            if (client.Player && client.State == ClientState.Play)
                players.push(client.Player);
            return players;
        }, []);
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
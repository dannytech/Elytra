import { Socket, Server } from "net";
import { Constants } from "../Configuration";
import { Client, ClientState } from "./Client";
import { ServerKeepAlivePacket } from "./states/play/ServerKeepAlivePacket";
import { PlayerInfoActions, PlayerInfoPacket } from "./states/play/PlayerInfoPacket";
import { ProtocolStub } from "./ProtocolStub";

export class ClientBus {
    private _Server: Server;
    private _Clients: Client[];
    private _ClientCounter: number;

    public get Clients(): Client[] {
        return this._Clients;
    }

    constructor(server: Server) {
        this._Server = server;
        this._ClientCounter = 0;

        this._Clients = [];

        // Attach a connection listener
        this._Server.on("connection", this._HandleConnection.bind(this));

        // Send and check for keepalives
        setInterval(() => {
            this.Broadcast((client: Client) => {
                if (client.Protocol.state == ClientState.Play) {
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
                if (client.Protocol.state == ClientState.Play) {
                    const onlinePlayers: Client[] = this.Clients.filter((client: Client) => client.Protocol.state == ClientState.Play && client.Player.Metadata.uuid);

                    client.Queue(new PlayerInfoPacket(client, PlayerInfoActions.UpdateLatency, onlinePlayers));
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
        this._Clients.push(client);

        // Client receive loop
        client.Receive(new ProtocolStub(socket));

        // On a disconnection, purge the client object from the bus
        client.once("disconnected", () => {
            this._Clients.splice(this._Clients.indexOf(client), 1);
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
            this._Clients.forEach(async (client: Client) => {
                callback(client);

                // Send any queued packets
                await client.Send();

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
        for (let i: number; i >= this._Clients.length - 1; i--) {
            this._Clients[i].Disconnect();
        }
    }
}
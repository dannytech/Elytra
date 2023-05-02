import { Socket, Server as TCPServer } from "net";
import { Constants } from "../Configuration";
import { Client, ClientState } from "./Client";
import { ServerKeepAlivePacket } from "./states/play/ServerKeepAlivePacket";
import { PlayerInfoActions, PlayerInfoPacket } from "./states/play/PlayerInfoPacket";
import { ProtocolStub } from "./ProtocolStub";

type ClientArray = {
    clients: Client[];
    counter: number;
};

export class Server {
    private _Server: TCPServer;
    private _Clients: ClientArray;

    /**
     * Returns the list of clients currently connected to the server
     * @returns {Client[]} The list of clients
     */
    public get Clients(): Client[] {
        return this._Clients.clients;
    }

    constructor(server: TCPServer) {
        this._Server = server;
        this._Clients = {
            clients: [],
            counter: 0
        };

        // Attach a connection listener
        this._Server.on("connection", this._HandleConnection.bind(this));

        // Send and check for keepalives
        setInterval(() => {
            this.Broadcast((client: Client) => {
                if (client.Protocol.state == ClientState.Play) {
                    // If the client keepalive has expired, disconnect it uncleanly
                    if (client.KeepAlive?.last && Date.now() - client.KeepAlive.last > Constants.KeepAliveInterval * 4)
                        client.Disconnect();
                    else
                        client.Queue(new ServerKeepAlivePacket(client));
                }
            });
        }, Constants.KeepAliveInterval);

        // Send regular client latency updates
        setInterval(() => {
            // Collect online clients
            const onlinePlayers: Client[] = this.Clients.filter((client: Client) => client.Protocol.state == ClientState.Play && client.Player.Metadata.uuid);

            this.Broadcast((client: Client) => {
                // Only send latency information to fully joined players
                if (client.Protocol.state == ClientState.Play)
                    client.Queue(new PlayerInfoPacket(client, PlayerInfoActions.UpdateLatency, onlinePlayers));
            });
        }, Constants.KeepAliveInterval * 2);
    }

    /**
     * Bootstrap a client to send and receive packets
     * @param {Socket} socket A reference to the TCP socket connection
     * @async
     */
    private async _HandleConnection(socket: Socket) {
        const client: Client = new Client(socket, this._Clients.counter++);
        this._Clients.clients.push(client);

        // Client receive loop
        client.Receive(new ProtocolStub(socket));

        // On a disconnection, purge the client object from the bus
        client.once("disconnected", () => {
            this._Clients.clients.splice(this._Clients.clients.indexOf(client), 1);
        });

        // Handle errors and disconnects
        socket.once("end", client.Disconnect.bind(client));
        socket.once("error", client.Disconnect.bind(client));
    }

    /**
     * Send one or more packets to all clients
     * @param {function} callback A callback to generate per-client packets
     */
    public async Broadcast(callback: (client: Client) => void) {
        return new Promise<void>((resolve) => {
            this._Clients.clients.forEach(async (client: Client) => {
                callback(client);

                // Send any queued packets
                await client.Send();

                resolve();
            });
        });
    }

    /**
     * Close down the server, disconnecting clients and refusing incoming connections
     */
    public Stop() {
        // Stop accepting new clients
        this._Server.close();

        // Tell each client to disconnect and detach
        while (this._Clients.clients.length > 0) {
            const client: Client = this._Clients.clients.pop();

            client.Disconnect();
        }
    }
}
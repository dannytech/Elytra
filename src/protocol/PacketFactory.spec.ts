import anyTest, { TestFn } from "ava";
import { PacketDirection, PacketFactory } from "./PacketFactory";
import { Client, ClientState } from "./Client";
import { Socket } from "net";

const test = anyTest as TestFn<Client>;

test.before(t => {
    // Dummy login-state client
    t.context = new Client(new Socket(), 1);
    t.context.Protocol.version = 578;
    t.context.Protocol.state = ClientState.Status;
});

test.serial("Load packet mappings", async t => {
    await t.notThrowsAsync(PacketFactory.Load);
});

test.serial("Serverbound lookup", t => {
    // Convert packet ID to class name
    const packetName: string = PacketFactory.Lookup(PacketDirection.Serverbound, t.context, 0x00) as string;
    t.is("RequestPacket", packetName);
});

test.serial("Clientbound Lookup", t => {
    // Convert class name to packet ID
    const packetId: number = PacketFactory.Lookup(PacketDirection.Clientbound, t.context, "ResponsePacket") as number;
    t.is(0x00, packetId);
});

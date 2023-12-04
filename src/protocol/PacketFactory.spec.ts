import { Socket } from "net";
import anyTest, { TestFn } from "ava";
import { PacketDirection, PacketFactory } from "./PacketFactory";
import { Client, ClientState } from "./Client";

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
    const packetName: string = PacketFactory.Lookup(PacketDirection.Serverbound, t.context, 0x00);
    t.is(packetName, "RequestPacket");
});

test.serial("Serverbound reverse lookup", t => {
    // Convert packet ID to class name
    const packetName: number = PacketFactory.Lookup(PacketDirection.Serverbound, t.context, "RequestPacket");
    t.is(packetName, 0x00);
});

test.serial("Clientbound lookup", t => {
    // Convert class name to packet ID
    const packetId: number = PacketFactory.Lookup(PacketDirection.Clientbound, t.context, "ResponsePacket");
    t.is(packetId, 0x00);
});

test.serial("Clientbound reverse lookup", t => {
    // Convert class name to packet ID
    const packetName: string = PacketFactory.Lookup(PacketDirection.Clientbound, t.context, 0x00);
    t.is(packetName, "ResponsePacket");
});

test.serial("Failed serverbound lookup", t => {
    const packetName: string | undefined = PacketFactory.Lookup(PacketDirection.Serverbound, t.context, 0xFF);
    t.is(packetName, undefined);
});

test.serial("Failed clientbound lookup", t => {
    const packetName: number | undefined = PacketFactory.Lookup(PacketDirection.Serverbound, t.context, "BadPacket");
    t.is(packetName, undefined);
});
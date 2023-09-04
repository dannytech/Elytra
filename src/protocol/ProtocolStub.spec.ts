import { Duplex } from "stream";
import anyTest, { TestFn } from "ava";
import { ProtocolStub } from "./ProtocolStub";
import { WritableBuffer } from "./WritableBuffer";

const test = anyTest as TestFn<ProtocolStub>;

// Create a large buffer to read from
const buf: Buffer = Buffer.alloc(2000).fill(0xFF);

test.beforeEach(t => {
    // Create a writable buffer
    const writable: WritableBuffer = new WritableBuffer();

    // Write the packet length and then the packet
    writable.WriteVarInt(buf.length);
    writable.Write(buf);

    // Construct a duplex stream to read from
    const stream = new Duplex({
        read() {
            this.push(writable.Buffer);

            // Push EOF to end the stream
            this.push(null);
        }
    });

    t.context = new ProtocolStub(stream);
});

test("Read packet length", async t => {
    // Read the length header
    const length: number = await t.context.ReadPacketLength();

    t.is(length, 2000);
});

test("Read packet", async t => {
    // Read the length header
    const length: number = await t.context.ReadPacketLength();

    // Read the specified number of bytes from the stream as a Buffer
    const packet: Buffer = await t.context.Read(length);

    t.deepEqual(packet, buf);
});

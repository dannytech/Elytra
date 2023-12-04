import anyTest, { TestFn } from "ava";
import { UUID } from "../game/UUID";
import { ReadableBuffer } from "./ReadableBuffer";

// The context for all tests will be a ReadableBuffer
const test = anyTest as TestFn<ReadableBuffer>;

// Generic buffer to read from
const buf = Buffer.from([ 0xFF, 0x00, 0x1F ]);

test("Read all bytes", t => {
    // Bytes to be read from the buffer
    t.context = new ReadableBuffer(buf);

    t.deepEqual(t.context.Read(), buf);
});

test("Read bytes", t => {
    // Bytes to be read from the buffer
    t.context = new ReadableBuffer(buf);

    t.deepEqual(t.context.Read(2), Buffer.from([ 0xFF, 0x00 ]));
});

test("Read byte", t => {
    t.context = new ReadableBuffer(buf);

    t.is(t.context.ReadByte(), 0xFF);
});

test("Read negative signed byte", t => {
    t.context = new ReadableBuffer(buf);

    t.is(t.context.ReadSignedByte(), -0x01);
});

test("Read zero signed byte", t => {
    t.context = new ReadableBuffer(buf);

    // Discard the first byte
    t.context.ReadByte();

    t.is(t.context.ReadSignedByte(), 0x00);
});

test("Read positive signed byte", t => {
    t.context = new ReadableBuffer(buf);

    // Discard the first two bytes
    t.context.Read(2);

    t.is(t.context.ReadSignedByte(), 0x1F);
});

test("Read boolean", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x00 ]));

    t.is(t.context.ReadBool(), false);
});

test("Read out-of-range boolean", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0xFF ]));

    t.is(t.context.ReadBool(), true);
});

test("Read character", t => {
    // Single character to read from buffer
    const char = "c";
    t.context = new ReadableBuffer(Buffer.from(char));

    t.is(t.context.ReadChar(), char);
});

test("Read VarChar", t => {
    // String which will be read from buffer
    const str = "Hello world!";

    // Calculated string length and buffer (not a VarInt because the string is short)
    const length = Buffer.from([ 0x0C ]);
    const strBuf = Buffer.from(str);

    t.context = new ReadableBuffer(Buffer.concat([ length, strBuf ]));

    t.is(t.context.ReadVarChar(), str);
});

// Macro to test multiple VarInt test cases
const readVarIntMacro = test.macro({
    exec(t, input: Buffer, expected: number) {
        t.context = new ReadableBuffer(input);

        t.is(t.context.ReadVarInt(), expected);
    },
    title(...[,,expected]) {
        return `Read VarInt ${expected}`.trim();
    }
});

test(readVarIntMacro, Buffer.from([ 0x00 ]), 0);
test(readVarIntMacro, Buffer.from([ 0x01 ]), 1);
test(readVarIntMacro, Buffer.from([ 0x02 ]), 2);
test(readVarIntMacro, Buffer.from([ 0x7F ]), 127);
test(readVarIntMacro, Buffer.from([ 0x80, 0x01 ]), 128);
test(readVarIntMacro, Buffer.from([ 0xFF, 0x01 ]), 255);
test(readVarIntMacro, Buffer.from([ 0xDD, 0xC7, 0x01 ]), 25565);
test(readVarIntMacro, Buffer.from([ 0xFF, 0xFF, 0x7F ]), 2097151);
test(readVarIntMacro, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0x07 ]), 2147483647);
test(readVarIntMacro, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0x0F ]), -1);
test(readVarIntMacro, Buffer.from([ 0x80, 0x80, 0x80, 0x80, 0x08 ]), -2147483648);

// Macro to test multiple VarLong test cases
const readVarLongMacro = test.macro({
    exec(t, input: Buffer, expected: bigint) {
        t.context = new ReadableBuffer(input);

        t.is(t.context.ReadVarLong(), expected);
    },
    title(...[,,expected]) {
        return `Read VarLong ${expected}`.trim();
    }
});

test(readVarLongMacro, Buffer.from([ 0x00 ]), 0n);
test(readVarLongMacro, Buffer.from([ 0x01 ]), 1n);
test(readVarLongMacro, Buffer.from([ 0x02 ]), 2n);
test(readVarLongMacro, Buffer.from([ 0x7F ]), 127n);
test(readVarLongMacro, Buffer.from([ 0x80, 0x01 ]), 128n);
test(readVarLongMacro, Buffer.from([ 0xFF, 0x01 ]), 255n);
test(readVarLongMacro, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0x07 ]), 2147483647n);
test(readVarLongMacro, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F ]), 9223372036854775807n);
test(readVarLongMacro, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01 ]), -1n);
test(readVarLongMacro, Buffer.from([ 0x80, 0x80, 0x80, 0x80, 0xF8, 0xFF, 0xFF, 0xFF, 0xFF, 0x01 ]), -2147483648n);
test(readVarLongMacro, Buffer.from([ 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x01 ]), -9223372036854775808n);

test("Read signed short", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x01, 0x23 ]));

    t.is(t.context.ReadInt16(), 0x0123);
});

test("Read signed int", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x01, 0x23, 0x45, 0x67 ]));

    t.is(t.context.ReadInt32(), 0x01234567);
});

test("Read signed long", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF ]));

    t.is(t.context.ReadInt64(), 0x0123456789ABCDEFn);
});

test("Read unsigned short", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x01, 0x23 ]));

    t.is(t.context.ReadUint16(), 0x0123);
});

test("Read unsigned int", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x01, 0x23, 0x45, 0x67 ]));

    t.is(t.context.ReadUint32(), 0x01234567);
});

test("Read unsigned long", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF ]));

    t.is(t.context.ReadUint64(), 0x0123456789ABCDEFn);
});

test("Read single float", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x3F, 0x00, 0x00, 0x00 ]));

    t.is(t.context.ReadSingle(), 0.5);
});

test("Read double float", t => {
    t.context = new ReadableBuffer(Buffer.from([ 0x3F, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]));

    t.is(t.context.ReadDouble(), 0.5);
});

test("Read JSON", t => {
    // Object to read from buffer
    const obj = {
        foo: "bar",
        valid: true,
        num: 25
    };

    // Calculated string length and buffer (not a VarInt because the object is short)
    const length = Buffer.from([ 0x23 ]);
    const strBuf = Buffer.from("{\"foo\":\"bar\",\"valid\":true,\"num\":25}");

    t.context = new ReadableBuffer(Buffer.concat([ length, strBuf ]));

    t.deepEqual(t.context.ReadJSON(), obj);
});

test("Read UUID", t => {
    // UUID which will be read from buffer
    const uuid = new UUID("761a51d962e54f99abec5e0e857766aa");

    t.context = new ReadableBuffer(Buffer.from([ 0x76, 0x1a, 0x51, 0xd9, 0x62, 0xe5, 0x4f, 0x99, 0xab, 0xec, 0x5e, 0x0e, 0x85, 0x77, 0x66, 0xaa ]));

    t.deepEqual(t.context.ReadUUID(), uuid);
});

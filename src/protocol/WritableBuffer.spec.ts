import anyTest, { TestFn } from "ava";
import { WritableBuffer } from "./WritableBuffer";
import { UUID } from "../game/UUID";

// The context for all tests will be a WritableBuffer
const test = anyTest as TestFn<WritableBuffer>;

test.beforeEach(t => {
    // Create WritableBuffer for each test
    t.context = new WritableBuffer();
});

test("Write bytes", t => {
    // Bytes to be inserted into the buffer
    const buf = Buffer.from([ 0xFF, 0x00, 0x1F ]);
    t.context.Write(buf);

    t.deepEqual(t.context.Buffer, buf);
});

test("Write byte", t => {
    t.context.WriteByte(0xFF);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0xFF ]));
});

test("Write negative signed byte", t => {
    t.context.WriteSignedByte(-0x80);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x80 ]));
});

test("Write zero signed byte", t => {
    t.context.WriteSignedByte(0x00);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x00 ]));
});

test("Write positive signed byte", t => {
    t.context.WriteSignedByte(0x7F);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x7F ]));
});

test("Write prepended byte", t => {
    t.context.WriteByte(0x00);
    t.context.Prepend().WriteByte(0xFF);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0xFF, 0x00 ]));
});

test("Write illegal byte", t => {
    t.throws(() => t.context.WriteByte(0xFFFF));

    t.deepEqual(t.context.Buffer, Buffer.alloc(0));
});

test("Write boolean", t => {
    t.context.WriteBool(true);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01 ]));
});

test("Write character", t => {
    // Single character to write into buffer
    const char = "c";
    t.context.WriteChar(char);

    t.deepEqual(t.context.Buffer, Buffer.from(char));
});

test("Write VarChar", t => {
    // String which will be written into buffer
    const str = "Hello world!";

    // Calculated string length and buffer (not a VarInt because the string is short)
    const length = Buffer.from([ 0x0C ]);
    const strBuf = Buffer.from(str);

    t.context.WriteVarChar(str);

    t.deepEqual(t.context.Buffer, Buffer.concat([ length, strBuf ]));
});

// Macro to test multiple VarInt test cases
const writeVarIntMacro = test.macro({
    exec(t, input: number, expected: Buffer) {
        t.context.WriteVarInt(input);

        t.deepEqual(t.context.Buffer, expected);
    },
    title(...[,input,]) {
        return `Write VarInt ${input}`.trim();
    }
});

test(writeVarIntMacro, 0, Buffer.from([ 0x00 ]));
test(writeVarIntMacro, 1, Buffer.from([ 0x01 ]));
test(writeVarIntMacro, 2, Buffer.from([ 0x02 ]));
test(writeVarIntMacro, 127, Buffer.from([ 0x7F ]));
test(writeVarIntMacro, 128, Buffer.from([ 0x80, 0x01 ]));
test(writeVarIntMacro, 255, Buffer.from([ 0xFF, 0x01 ]));
test(writeVarIntMacro, 25565, Buffer.from([ 0xDD, 0xC7, 0x01 ]));
test(writeVarIntMacro, 2097151, Buffer.from([ 0xFF, 0xFF, 0x7F ]));
test(writeVarIntMacro, 2147483647, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0x07 ]));
test(writeVarIntMacro, -1, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0x0F ]));
test(writeVarIntMacro, -2147483648, Buffer.from([ 0x80, 0x80, 0x80, 0x80, 0x08 ]));

// Macro to test multiple VarLong test cases
const writeVarLongMacro = test.macro({
    exec(t, input: bigint, expected: Buffer) {
        t.context.WriteVarLong(input);

        t.deepEqual(t.context.Buffer, expected);
    },
    title(...[,input,]) {
        return `Write VarLong ${input}`.trim();
    }
});

test(writeVarLongMacro, 0n, Buffer.from([ 0x00 ]));
test(writeVarLongMacro, 1n, Buffer.from([ 0x01 ]));
test(writeVarLongMacro, 2n, Buffer.from([ 0x02 ]));
test(writeVarLongMacro, 127n, Buffer.from([ 0x7F ]));
test(writeVarLongMacro, 128n, Buffer.from([ 0x80, 0x01 ]));
test(writeVarLongMacro, 255n, Buffer.from([ 0xFF, 0x01 ]));
test(writeVarLongMacro, 2147483647n, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0x07 ]));
test(writeVarLongMacro, 9223372036854775807n, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F ]));
test(writeVarLongMacro, -1n, Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01 ]));
test(writeVarLongMacro, -2147483648n, Buffer.from([ 0x80, 0x80, 0x80, 0x80, 0xF8, 0xFF, 0xFF, 0xFF, 0xFF, 0x01 ]));
test(writeVarLongMacro, -9223372036854775808n, Buffer.from([ 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x01 ]));

test("Write signed short", t => {
    t.context.WriteInt16(0x0123);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01, 0x23 ]));
});

test("Write signed int", t => {
    t.context.WriteInt32(0x01234567);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01, 0x23, 0x45, 0x67 ]));
});

test("Write signed long", t => {
    t.context.WriteInt64(0x0123456789ABCDEFn);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF ]));
});

test("Write unsigned short", t => {
    t.context.WriteUint16(0x0123);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01, 0x23 ]));
});

test("Write unsigned int", t => {
    t.context.WriteUint32(0x01234567);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01, 0x23, 0x45, 0x67 ]));
});

test("Write unsigned long", t => {
    t.context.WriteUint64(0x0123456789ABCDEFn);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF ]));
});

test("Write single float", t => {
    t.context.WriteSingle(0.5);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x3F, 0x00, 0x00, 0x00 ]));
});

test("Write double float", t => {
    t.context.WriteDouble(0.5);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x3F, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]));
});

test("Write JSON", t => {
    // Object to stringify and insert into buffer
    const obj = {
        foo: "bar",
        valid: true,
        num: 25
    };

    // Calculated string length and buffer (not a VarInt because the object is short)
    const length = Buffer.from([ 0x23 ]);
    const strBuf = Buffer.from("{\"foo\":\"bar\",\"valid\":true,\"num\":25}");

    t.context.WriteJSON(obj);

    t.deepEqual(t.context.Buffer, Buffer.concat([ length, strBuf ]));
});

test("Write UUID", t => {
    // UUID which will be written into buffer
    const uuid = new UUID("761a51d962e54f99abec5e0e857766aa");

    t.context.WriteUUID(uuid);

    t.deepEqual(t.context.Buffer, Buffer.from([ 0x76, 0x1a, 0x51, 0xd9, 0x62, 0xe5, 0x4f, 0x99, 0xab, 0xec, 0x5e, 0x0e, 0x85, 0x77, 0x66, 0xaa ]));
});

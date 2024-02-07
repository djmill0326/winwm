//this is unhinged and i'm not sure why i'm trying to do this.
const clamp = (x, start, end) => Math.min(Math.max(start, x), end);

const Constants = {
    TRUE: 1,
    FALSE: 0
};

const Type = {
    Boolean: (x) => Boolean(x) ? Constants.TRUE : Constants.FALSE,
    Byte: (x) => clamp(Number(x), -127, 127),
    UByte: (x) => clamp(Number(x), 0, 255),
    Short: (x) => clamp(Number(x), -32767, 32767),
    UShort: (x) => clamp(Number(x), 0, 65535),
    Int: (x) => clamp(Number(x), -2147483647, 2147483647),
    UInt: (x) => clamp(Number(x), 0, 4294967295),
    Fixed: (x) => Type.Int(x),
    Int64: (x) => clamp(Number(x), -Math.pow(2, 63) - 1, Math.pow(2, 63) - 1),
    UInt64: (x) => clamp(Number(x), 0, Math.pow(2, 64) - 1),
    Sizei: (x) => Type.Int(x),
    Enum: (x) => Type.Int(x),
    Intptr: (x) => Type.Int(x),
    Sizeiptr: (x) => Type.UInt(x),
    Sync: (x) => Type.Sizeiptr(x),
    Bitfield: (x) => x < 0 ? Type.Int(x) : Type.UInt(x),
    Half: (x) => Number(x),
    Float: (x) => Number(x),
    Clampf: (x) => clamp(Number(x), 0, 1),
    Double: (x) => Number(x),
    Clampd: (x) => clamp(Number(x), 0, 1)
};

export const GL = {
    ...Constants,
    ...Type
};

export default GL;
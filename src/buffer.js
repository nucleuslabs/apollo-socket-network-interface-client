export function readUInt64BE(offset, noAssert = false) {
    return (this.readUInt32BE(offset, noAssert) << 8) + this.readUInt32BE(offset + 4, noAssert);
}

export function writeUInt64BE(value, offset, noAssert = false) {
    let hi = (value / 4294967296) | 0;
    let lo = (value % 4294967296) | 0;
    this.writeInt32BE(hi, offset, noAssert);
    this.writeInt32BE(lo, offset + 4, noAssert);
}
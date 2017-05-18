// TODO: extract to separate project
import Net from 'net';
import Msgpack from 'msgpack-lite';
import {readUInt64BE, writeUInt64BE} from './buffer';
import makeDebug from 'debug';
import Chalk from 'chalk';
const debug = makeDebug('asnic');

const fallback = [10, 50, 100, 250, 500, 1000, 2000];

class LocalNetworkInterface {
    constructor({path}) {
        this._sock = new Net.Socket();
        this._pending = {};
        this._count = 0;
        this._retry = 0;

        let buffer, queryId, length, offset;

        const connect = () => {
            this._sock.connect({path});
        };
        this._sock.on('connect', () => {
            this._retry = 0;
            debug(`${Chalk.green('Connected')} to ${Chalk.underline(path)}`);
        });
        this._sock.on('data', packet => {
            // log("Start",queryId,packet.length);
            if(!queryId) {  // new message
                if(packet.length < 16) {
                    throw new Error(`Packet is too small; missing header?`);
                }
                queryId = packet::readUInt64BE(0);
                // log('GOT RESPONSE TO QUERY',queryId);
                length = packet::readUInt64BE(8);
                offset = 0;
                buffer = Buffer.allocUnsafe(length);
                packet.copy(buffer, offset, 16);
                offset += packet.length - 16;
            } else {
                packet.copy(buffer, offset);
                offset += packet.length;
            }
            if(offset >= length) {
                // log("Finish",queryId,packet.length);
                let req;
                try {
                    req = Msgpack.decode(buffer);
                } catch(err) {
                    debug(`${Chalk.red('Msgpack.decode error:')} ${err.message}`);
                    return;
                }
                // log('RESOLVING QUERY',queryId,req);
                this._pending[queryId].resolve(req);
                delete this._pending[queryId];
                queryId = null;
                length = null;
                offset = null;
                buffer = null; // TODO: fill with remainder of packet
            }
        });
        this._sock.on('end', () => {
            debug(`${Chalk.yellow('Lost connection')} to ${Chalk.underline(path)}. Attempting to reconnect...`);
            process.nextTick(connect);
        });
        this._sock.on('error', err => {
            if(err.code === 'ENOENT') {
                let ms = fallback[this._retry];
                if(this._retry < fallback.length - 1) ++this._retry;
                debug(`Socket server is ${Chalk.red('unavailable')}. Trying again in ${Chalk.bold(`${ms} ms`)}`);
                setTimeout(connect, ms);
            } else {
                throw err;
            }
        });
        connect();
    }

    query(request) {
        return new Promise((resolve, reject) => {
            let queryId = this._count++;
            // log("Start",queryId);
            // let payload = Object.assign({}, request, {queryId});
            this._pending[queryId] = {resolve, reject};
            let pack = Msgpack.encode(request);
            let sendBuffer = Buffer.allocUnsafe(pack.length + 16);
            sendBuffer::writeUInt64BE(queryId, 0);
            sendBuffer::writeUInt64BE(pack.length, 8);
            pack.copy(sendBuffer, 16);
            // log('request', request, pack.length, sendBuffer.length);
            let flushed = this._sock.write(sendBuffer);
            // log('flushed', flushed);
        });
    }

    disconnect() {
        return new Promise((resolve, reject) => {
            this._sock.end(resolve);
        });
    }
}

export default LocalNetworkInterface;
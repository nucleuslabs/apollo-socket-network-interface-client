// TODO: extract to separate project
import Net from 'net';
import Msgpack from 'msgpack-lite';
import makeDebug from 'debug';
const debug = makeDebug('asnic');
import Chalk from 'chalk';
import processData from './processData';

const fallback = [10, 50, 100, 250, 500, 1000, 2000];

export default class LocalNetworkInterface {
    constructor({path}) {
        this._sock = new Net.Socket();
        this._pending = {};
        this._count = 0;
        this._retry = 0;

        const connect = () => {
            this._sock.connect({path});
        };
        
        this._sock.on('connect', () => {
            this._retry = 0;
            debug(`${Chalk.green('Connected')} to ${Chalk.underline(path)}`);
        });

        this._sock.on('data', processData((queryId,msgBuf) => {
            if(!this._pending[queryId]) {
                debug(`Got response to query ${queryId}, but it's not pending`);
                return;
            }
            
            // debug(`got response to query ${queryId}, length is ${msgBuf.length}`);
            
            try {
                let req = Msgpack.decode(msgBuf);
                this._pending[queryId].resolve(req);
            } catch(err) {
                debug('Msgpack decode error',err);
                this._pending[queryId].reject(err);
            } finally {
                delete this._pending[queryId];
            }
        }));
        
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
            let sendBuffer = Buffer.allocUnsafe(pack.length + 12);
            
            sendBuffer.writeUIntBE(queryId, 0, 6);
            sendBuffer.writeUIntBE(pack.length, 6, 6);
            pack.copy(sendBuffer, 12);
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

import makeDebug from 'debug';
const debug = makeDebug('processData');

export default function processData(callback) {
    let msgBuf = null, accBuf = Buffer.allocUnsafe(0), queryId = null, msgLength = null;
    
    return packet => {
        accBuf = Buffer.concat([accBuf,packet]);

        // debug(`Got packet of length ${packet.length}, accBuf is now ${accBuf.length}`);
        
        do {
            if(queryId === null && accBuf.length >= 6) {
                queryId = accBuf.readUIntBE(0, 6, true);
                accBuf = accBuf.slice(6);
            }

            if(queryId !== null && msgLength === null && accBuf.length >= 6) {
                msgLength = accBuf.readUIntBE(0, 6, true);
                accBuf = accBuf.slice(6);
            }
            
            if(queryId !== null && msgLength !== null && accBuf.length >= msgLength) {
                callback(queryId, accBuf.slice(0, msgLength));

                accBuf = accBuf.slice(msgLength);
                queryId = null;
                msgLength = null;
                msgBuf = null;
                // debug(`accBuf cleared, length is now ${accBuf.length}`);
            } else {
                // debug(`${msgLength-accBuf.length} bytes short of a message`);
                break;
            }
        } while(accBuf.length > 0);
    };
}
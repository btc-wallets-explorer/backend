import {Socket} from 'net';


var client = new net.Socket();

export const connect = (url, port, protocol) => {
    client.connect(port, url);
}

client.on('data', data => {
    (data + '').split('\n').filter(x=>x != '').map(x => JSON.parse(x).result);
});

async function get(method, params, map) {
    return new Promise((resolve, reject) => {
        let rpc = {"jsonrpc": "2.0", "method": method, "id": 0, "params": params};
        client.write(JSON.stringify(rpc) + '\n');
    });
}



export const getHistory = (scriptHash) => get("blockchain.scripthash.get_history", [scriptHash], result => result[0]);
export const getBalance = (scriptHash) => get("blockchain.scripthash.get_balance", [scriptHash], result => result[0]);
export const listUnspent = (scriptHash) => get("blockchain.scripthash.listunspent", [scriptHash], result => result[0]);
export const getTransaction = (transaction) => get("blockchain.transaction.get", [transaction, true], result => result);

// import ElectrumClient from 'electrum-client';

// const connect = async (url, port, protocol) => {
//     const connection = new ElectrumClient(port, url, protocol);
//     await connection.connect();
//     return connection;
// };

// const close = async (connection) => {
//     return await connection.close();
// }

// const getTransaction = async (connection, tx_hash) => {
//     const result = await connection.blockchainTransaction_get(tx_hash, true);
//     console.log(JSON.stringify(result, null, 2));
//     console.log(result + '');
//     return JSON.parse(x).result;
// };

export {connect, close, getTransaction};
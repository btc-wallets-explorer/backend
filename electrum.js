var net = require('net');
var util = require('util');


var client = new net.Socket();
client.connect(50001, 'localhost');

async function get(method, scriptHash) {
    return new Promise((resolve, reject) => {
        client.on('data', data =>
                  resolve((data + '')
                          .split('\n')
                          .filter(x => x !== '')
                          .map(x => JSON.parse(x).result)[0])
                 );
        let rpc = {"jsonrpc": "2.0", "method": "blockchain.scripthash." + method, "id": 0, "params": [scriptHash]};
        client.write(JSON.stringify(rpc) + '\n');
    });
}

async function getTransaction(transaction) {
    return new Promise((resolve, reject) => {
        client.on('data', data =>
                  resolve((data + '')
                          .split('\n')
                          .filter(x => x !== '')
                          .map(x => JSON.parse(x).result)[0])
                 );
        let rpc = {"jsonrpc": "2.0", "method": "blockchain.transaction.get", "id": 0, "params": [transaction, true]};
        client.write(JSON.stringify(rpc) + '\n');
    });
}


exports.getHistory = (scriptHash, callback) => get("get_history", scriptHash);
exports.getBalance = (scriptHash, callback) => get("get_balance", scriptHash);
exports.listUnspent = (scriptHash, callback) => get("listunspent", scriptHash);

exports.getTransaction = getTransaction;

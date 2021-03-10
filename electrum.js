var net = require('net');

function get(method, scriptHash, callback) {
    var client = new net.Socket();
    client.connect(50001, '127.0.0.1', function() {

        client.on('data', function(data) {
            callback(JSON.parse(data).result);
        });

	    let rpc = {"jsonrpc": "2.0", "method": "blockchain.scripthash." + method, "id": 0, "params": [scriptHash]};
	    client.write(JSON.stringify(rpc));
	    client.end();
    });

}

function getTransaction(transaction, callback) {
    var client = new net.Socket();
    client.connect(50001, '127.0.0.1', function() {

        client.on('data', function(data) {
            callback(JSON.parse(data).result);
        });

	    let rpc = {"jsonrpc": "2.0", "method": "blockchain.transaction.get", "id": 0, "params": [transaction, true]};
	    client.write(JSON.stringify(rpc));
	    client.end();
    });

}


exports.getHistory = (scriptHash, callback) => get("get_history", scriptHash, callback);
exports.getBalance = (scriptHash, callback) => get("get_balance", scriptHash, callback);
exports.listUnspent = (scriptHash, callback) => get("listunspent", scriptHash, callback);

exports.getTransaction = getTransaction;
exports.close = function () {client.destroy();};

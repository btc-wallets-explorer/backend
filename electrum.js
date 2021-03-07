var net = require('net');

function getHistory(scriptHash, callback) {
    var client = new net.Socket();
    client.connect(50001, '127.0.0.1', function() {

        client.on('data', function(data) {
            callback(JSON.parse(data).result);
        });

	    let rpc = {"jsonrpc": "2.0", "method": "blockchain.scripthash.get_history", "id": 0, "params": [scriptHash]};
	    client.write(JSON.stringify(rpc));
	    client.end();
    });
}

exports.getHistory = getHistory;
exports.close = function () {client.destroy();};

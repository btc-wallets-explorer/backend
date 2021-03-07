const fs = require('fs');
const WebSocket = require('ws');

const btc = require('./bitcoin');
const electrum = require('./electrum');

// load wallets
let wallets;
try {
    const data = fs.readFileSync('./wallets.json', 'utf8');
    wallets = JSON.parse(data);
} catch (err) {
    console.log(`Error reading file from disk: ${err}`);
}

const server = new WebSocket.Server({
    port: 8080
});

server.on('connection', function(socket) {
    socket.on('message', function(msg) {
        const xpub = wallets['single'].xpubs[0];
        const xpubs = wallets['multi'].xpubs;

        let address = btc.getAddressForMultisig(xpubs, 0);
        let scriptHash = btc.toScriptHash(address);

        electrum.getHistory(scriptHash, x => socket.send(JSON.stringify(x)));
    });
});





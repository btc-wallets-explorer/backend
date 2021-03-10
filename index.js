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

const xpub = wallets['single'].xpubs[0];
const xpubs = wallets['multi'].xpubs;


// let address = btc.getAddressForMultisig(xpubs, 0);
let address = btc.getAddress(xpub, 10);
let scriptHash = btc.toScriptHash(address);



electrum.getTransaction("0489a9911d17f146545fe6ac3a9523057fff8c06fae4aa9b49bca8317919f81b", x => console.log(x));
let data = [];
electrum.getHistory(scriptHash, x => console.log(x));
server.on('connection', function(socket) {
    socket.on('message', function(msg) {
        electrum.getHistory(scriptHash, x => socket.send(JSON.stringify(data)));
    });
});





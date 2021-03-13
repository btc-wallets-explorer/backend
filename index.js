const fs = require('fs');

const WebSocket = require('ws');

const btc = require('./bitcoin');
const electrum = require('./electrum');
const helpers = require('./helpers');

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

const xpubs = wallets['multi'].xpubs;

let addresses = helpers.range(100).map(index => btc.getAddressForMultisig(xpubs, index));
let scriptHashes = addresses.map(a => btc.toScriptHash(a));

let address = addresses[0];
let scriptHash = scriptHashes[0];

electrum.getHistory(scriptHash, console.log);

// let histories = [];
// addresses.map(a => electrum.getHistory(a, h => histories.push(h)));


// let history;
// let transaction;
// electrum.getHistory(scriptHash, h => history = h);

// electrum.getTransaction(history[0].tx_hash, console.log);
// electrum.getTransaction(history[0].tx_hash, t => transaction = t);

// console.log(addresses);
// console.log(scriptHashes);

// electrum.getTransaction("0489a9911d17f146545fe6ac3a9523057fff8c06fae4aa9b49bca8317919f81b", x => console.log(x));

// electrum.getTransaction("0489a9911d17f146545fe6ac3a9523057fff8c06fae4aa9b49bca8317919f81b",
//                         x => console.log(x.vin[0].scriptSig));
// electrum.getTransaction("0489a9911d17f146545fe6ac3a9523057fff8c06fae4aa9b49bca8317919f81b",
//                         x => console.log(x.vout[0].scriptPubKey));

// var data =
//     {
//         "name": "Top Level",
//         "children": [
//             {
//                 "name": "Level 2: A",
//                 "children": [
//                     { "name": "Son of A" },
//                     { "name": "Daughter of A" }
//                 ]
//             },
//             { "name": "Level 2: B" }
//         ]
//     };
// electrum.getHistory(scriptHash, x => console.log(x));
// server.on('connection', function(socket) {
//     socket.on('message', function(msg) {
//         electrum.getHistory(scriptHash, x => socket.send(JSON.stringify(data)));
//     });
// });





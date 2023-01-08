async function main() {
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

    var addresses = helpers.range(100).map(index => btc.getAddressForMultisig(xpubs, index));
    var scriptHashes = addresses.map(a => btc.toScriptHash(a));
    var address = addresses[0];
    var scriptHash = scriptHashes[0];
    console.log(histories);

    var histories = [];
    for (h of scriptHashes) {
        var hist = await electrum.getHistory(h);

        if (hist.length > 0) {
            histories.push(hist);
        }
    }

    console.log(histories);
    var transactions = histories.map(h => h.map(t => t.tx_hash));
    var transactions = await Promise.all(histories.map(h => h.map(t => electrum.getTransaction(t))));

    var data =
        {
            "name": "Top Level",
            "children": [
                {
                    "name": "Level 2: A",
                    "children": [
                        { "name": "Son of A" },
                        { "name": "Daughter of A" }
                    ]
                },
                { "name": "Level 2: B" }
            ]
        };
    // electrum.getHistory(scriptHash, x => console.log(x));
    server.on('connection', function(socket) {
        socket.on('message', function(msg) {
            electrum.getHistory(scriptHash, x => socket.send(JSON.stringify(data)));
        });
    });

};
main();



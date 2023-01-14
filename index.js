import { readFileSync } from 'fs';
import WebSocket from 'ws';
import { getAddressForMultisig, toScriptHash } from './bitcoin.js';
import ElectrumClient from './deps/electrum-client/index.js';
import { range } from './helpers.js';

async function main() {
    const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
    await electrum.connect();

    // load wallets
    let wallets;
    try {
        const data = readFileSync('./wallets.json', 'utf8');
        wallets = JSON.parse(data);
    } catch (err) {
        console.log(`Error reading file from disk: ${err}`);
    }

    const xpubs = wallets['multi'].xpubs;
    var addresses = range(100).map(index => getAddressForMultisig(xpubs, index));
    var scriptHashes = addresses.map(a => toScriptHash(a));

    var histories = [];
    for (let h of scriptHashes) {
        var hist = await electrum.blockchainScripthash_getHistory(h);

        if (hist.length > 0) {
            histories.push(hist);
        }
    }
    var transactionHashes = histories.map(h => h.map(t => t.tx_hash)).flat();
    const transactions = {};

    for (const hash of transactionHashes) {
        transactions[hash] = await electrum.blockchainTransaction_get(hash, true);
    }
    console.log(Object.keys(transactions).length);

    let links = [];

    for (const transaction of Object.values(transactions)) {
        links = links.concat(transaction.vin.map(vin => ({ source: transaction.txid, target: vin.txid, value: 1 })));

        const tx_list = transaction.vin.map(vin => vin.txid).filter(id => typeof id === 'string');
        for (const tx of tx_list)
            transactions[tx] = await electrum.blockchainTransaction_get(tx, true)
    };

    console.log(Object.keys(transactions).length);


    let id = 0;
    const nodes = Object.keys(transactions).map(tx => ({ node: id++, name: tx }));


    var nodeHash = {};
    nodes.forEach(d => {
        nodeHash[d.name] = d.node;
    });

    links = links.map(d => ({
        source: nodeHash[d.source],
        target: nodeHash[d.target]
    }));

    const model = { nodes, links };
    console.log(model);
    // const model = {
    //     "nodes": [
    //         { "node": 0, "name": "node0" },
    //         { "node": 1, "name": "node1" },
    //         { "node": 2, "name": "node2" },
    //         { "node": 3, "name": "node3" },
    //         { "node": 4, "name": "node4" }
    //     ],
    //     "links": [
    //         { "source": 0, "target": 2, "value": 2 },
    //         { "source": 1, "target": 2, "value": 2 },
    //         { "source": 1, "target": 3, "value": 2 },
    //         { "source": 0, "target": 4, "value": 2 },
    //         { "source": 2, "target": 3, "value": 2 },
    //         { "source": 2, "target": 4, "value": 2 },
    //         { "source": 3, "target": 4, "value": 4 }
    //     ]
    // };


    const wss = new WebSocket.Server({ port: 8080 })

    wss.on("connection", ws => {
        console.log("new client connected");
        ws.on("message", data => {
            console.log(`Client has sent us: ${data}`);

            ws.send(JSON.stringify(model));
        });
        ws.on("close", () => {
            console.log("the client has connected");
        });
        ws.onerror = function () {
            console.log("Some Error occurred")
        }
    });
    console.log("The WebSocket server is running on port 8080");

};
main();



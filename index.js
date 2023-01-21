import { readFileSync } from 'fs';
import WebSocket from 'ws';
import { getAddressForMultisig, toScriptHash } from './bitcoin.js';
import ElectrumClient from './deps/electrum-client/index.js';
import { range } from './helpers.js';

async function main() {
    const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
    await electrum.connect();

    const loadWallets = (filename) => {
        let wallets;
        try {
            const data = readFileSync(filename, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.log(`Error reading file from disk: ${err}`);
        }
    }

    const wallets = loadWallets('./wallets.json');

    const xpubs = wallets['multi'].xpubs;
    var addresses = range(100).map(index => getAddressForMultisig(xpubs, index));
    var scriptHashes = addresses.map(a => toScriptHash(a));

    const histories = (await Promise.all(
        scriptHashes.map(async hash => electrum.blockchainScripthash_getHistory(hash)))
    ).flat();

    const transactions = await Promise.all(
        histories.map(async h => electrum.blockchainTransaction_get(h.tx_hash, true))
    );

    const transactionMap = Object.fromEntries(transactions.map(t => [t.txid, t]))
    const ourTransactions = Object.keys(transactionMap);

    const getTransaction = async (txid) => {
        if (!txid in transactionMap)
            transactionMap[txid] = await electrum.blockchainTransaction_get(txid, true);

        return transactionMap[txid];
    }

    const links = await Promise.all(transactions
        .flatMap(t => t.vin.map(vin => ({ target: t.txid, source: vin.txid, value: 1, vin })))
        .filter(l => ourTransactions.includes(l.target) && ourTransactions.includes(l.source))
        .map(async l => ({...l, value: (await getTransaction(l.vin.txid)).vout[l.vin.vout].value})));



console.log(Object.keys(transactions).length);

let id = 0;
let nodes = Object.values(transactionMap).map(tx => ({ id: id++, name: tx.txid, tx }));


const model = { nodes, links };
console.log(model);
// console.log(model);
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



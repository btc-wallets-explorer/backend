import { readFileSync } from 'fs';
import { WebSocketServer} from 'ws';
import { getAddress, getAddressForMultisig, toScriptHash } from './bitcoin.js';
import ElectrumClient from './deps/electrum-client/index.js';
import { range } from './helpers.js';

async function main() {
    const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
    await electrum.connect();

    const loadFile = (filename) => {
        try {
            const data = readFileSync(filename, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.log(`Error reading file from disk: ${err}`);
        }
    }

    const wallets = loadFile('./wallets.json');
    const settings = loadFile('./settings.json');

    const createModelForWallet = async (wallet, group) => {
        const addresses = 'xpub' in wallet ?
            range(100).map(index => getAddress(wallet.xpub, wallet.type, index, 0)) :
            range(100).map(index => getAddressForMultisig(wallet.xpubs, index))
        const changeAddresses = 'xpub' in wallet ?
            range(100).map(index => getAddress(wallet.xpub, wallet.type, index, 1)) :
            range(100).map(index => getAddressForMultisig(wallet.xpubs, index, 1))
        
        var scriptHashes = [...addresses, ...changeAddresses].map(a => toScriptHash(a));

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
            .map(async l => ({ ...l, value: (await getTransaction(l.vin.txid)).vout[l.vin.vout].value })));


        console.log(group, Object.keys(transactions).length);

        let id = 0;
        let nodes = Object.values(transactionMap).map(tx => ({ id: group + ' ' + id++, name: tx.txid, tx, group }));

        return { nodes, links };
    }

    const models = await Promise.all(Object.entries(wallets).map(async ([k, v]) => await createModelForWallet(v, k)));
    const model = {
        nodes: models.map(m => m.nodes).flat(),
        links: models.map(m => m.links).flat()
    }
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


    const wss = new WebSocketServer({ port: 8080 })

    wss.on("connection", ws => {
        console.log("new client connected");
        ws.on("message", data => {
            console.log(`Client has sent us: ${data}`);

            ws.send(JSON.stringify({model, settings}));
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



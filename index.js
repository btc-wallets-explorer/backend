import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
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

    const getAddresses = (wallet) => {
        const getAddressFn = 'xpub' in wallet ? getAddress : getAddressForMultisig;
        const xpubInfo = 'xpub' in wallet ? wallet.xpub : wallet.xpubs;

        const objs = [0, 1].map(isChange =>
            range(100).map(index => ({
                address: getAddressFn(xpubInfo, wallet.type, index, isChange),
                isChange,
                index,
                type: wallet.type
            }))
        ).flat();

        return Object.fromEntries(objs.map(o => [o.address, o]));
    }

    const getHistories = async (addresses) => {
        const histories = await Promise.all(
            addresses.map(async address => ({
                hash: toScriptHash(address),
                address,
                histories: await electrum.blockchainScripthash_getHistory(toScriptHash(address))
            })));

        return Object.fromEntries(
            histories
                .filter(h => h.histories.length > 0)
                .map(h => [h.hash, h])
        );
    }

    const getTransactions = async (txHashes) => {
        const transactions = await Promise.all(
            txHashes.map(async h => await electrum.blockchainTransaction_get(h, true))
        );

        return Object.fromEntries(transactions.map(t => [t.txid, t]))
    };

    const getTransaction = async (transactionMap, tx_hash) => {
        if (!(tx_hash in transactionMap))
            transactionMap[tx_hash] = await electrum.blockchainTransaction_get(tx_hash, true);

        return transactionMap[tx_hash];
    }

    const getScriptHashMapForWallet = async (wallet) => {
        const addressMap = getAddresses(wallet);
        return await getHistories(Object.keys(addressMap));
    }

    const generateLinks = async (transactionMap, walletScriptHashMap) => {
        const histories = Object.entries(walletScriptHashMap)
            .flatMap(([wallet, o]) =>
                Object.entries(o).flatMap(([scriptHash, v]) =>
                    v.histories.map(hist =>
                        ({ wallet, scriptHash, address: v.address, txid: hist.tx_hash }))));

        // load all other transactions
        const otherTransactions = histories.flatMap(h =>
            transactionMap[h.txid].vin.map(vin => vin.txid));
        await Promise.all(otherTransactions.map(async txid => await getTransaction(transactionMap, txid)));

        const incomingTxos = histories.flatMap(h =>
            transactionMap[h.txid].vin
                .map(vin => ({ ...h, vin, vout: transactionMap[vin.txid].vout[vin.vout] })))
            .filter(txo => txo.vout.scriptPubKey.address === txo.address);

        return incomingTxos.map(txo =>
            ({ ...txo, source: txo.vin.txid, target: txo.txid, value: txo.vout.value }))
    };

    const walletScriptHashMap = Object.fromEntries(await Promise.all(
        Object.keys(wallets).map(async w => [w, await getScriptHashMapForWallet(wallets[w])])
    ));

    const txHashes = Object.values(walletScriptHashMap)
        .flatMap(walletMap => Object.values(walletMap).flatMap(h => h.histories))
        .map(h => h.tx_hash);

    let transactionMap = await getTransactions(txHashes);

    const nodes = Object.values(transactionMap).map(tx => ({ id: tx.txid[0, 4], name: tx.txid, tx }));
    const links = await generateLinks(transactionMap, walletScriptHashMap);


    const model = { nodes, links };
    console.log(model);

    const wss = new WebSocketServer({ port: 8080 })

    wss.on("connection", ws => {
        console.log("new client connected");
        ws.on("message", data => {
            console.log(`Client has sent us: ${data}`);

            ws.send(JSON.stringify({ model, settings }));
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



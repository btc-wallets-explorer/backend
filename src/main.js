import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import ElectrumClient from '@mempool/electrum-client';
import { getAddress, getAddressForMultisig, toScriptHash } from './bitcoin.mjs';
import range from './helpers.mjs';

async function main() {
  const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
  await electrum.connect();

  const loadFile = (filename) => {
    try {
      const data = readFileSync(filename, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
    }
    return '';
  };

  const wallets = loadFile('resources/wallets.json');
  const settings = loadFile('resources/settings.json');

  const getAddresses = (wallet) => {
    const getAddressFn = 'xpub' in wallet ? getAddress : getAddressForMultisig;
    const xpubInfo = 'xpub' in wallet ? wallet.xpub : wallet.xpubs;

    const objs = [0, 1].map((isChange) => range(100).map((index) => ({
      address: getAddressFn(xpubInfo, wallet.type, index, isChange),
      isChange,
      index,
      type: wallet.type,
    }))).flat();

    return Object.fromEntries(objs.map((o) => [o.address, o]));
  };

  const getHistories = async (addressObjs) => {
    const histories = await Promise.all(
      addressObjs.map(async (o) => ({
        hash: toScriptHash(o.address),
        info: o,
        histories: await electrum.blockchainScripthash_getHistory(toScriptHash(o.address)),
      })),
    );

    return Object.fromEntries(
      histories
        .filter((h) => h.histories.length > 0)
        .map((h) => [h.hash, h]),
    );
  };

  const getTransactions = async (txHashes) => {
    const transactions = await Promise.all(
      txHashes.map(async (h) => electrum.blockchainTransaction_get(h, true)),
    );

    return Object.fromEntries(transactions.map((t) => [t.txid, t]));
  };

  const getTransaction = async (transactionMap, txHash) => {
    if (!(txHash in transactionMap)) {
      // eslint-disable-next-line no-param-reassign
      transactionMap[txHash] = await electrum.blockchainTransaction_get(txHash, true);
    }

    return transactionMap[txHash];
  };

  const getScriptHashMapForWallet = async (wallet) => {
    const addressMap = getAddresses(wallet);
    return getHistories(Object.values(addressMap));
  };

  const generateLinks = async (transactionMap, walletScriptHashMap) => {
    const histories = Object.entries(walletScriptHashMap)
      .flatMap(([wallet, o]) => Object.entries(o).flatMap(
        ([scriptHash, v]) => v.histories.map((hist) => ({
          wallet, scriptHash, info: v.info, txid: hist.tx_hash,
        })),
      ));

    // load all other transactions
    const otherTransactions = histories.flatMap(
      (h) => transactionMap[h.txid].vin.map((vin) => vin.txid),
    );
    await Promise.all(otherTransactions.map(
      async (txid) => getTransaction(transactionMap, txid),
    ));

    const incomingTxos = histories.flatMap((h) => transactionMap[h.txid].vin
      .map((vin) => ({ ...h, vin, vout: transactionMap[vin.txid].vout[vin.vout] })))
      .filter((txo) => txo.vout.scriptPubKey.address === txo.info.address);

    return incomingTxos.map((txo) => ({
      ...txo, source: txo.vin.txid, target: txo.txid, value: txo.vout.value,
    }));
  };

  const walletScriptHashMap = Object.fromEntries(await Promise.all(
    Object.keys(wallets).map(async (w) => [w, await getScriptHashMapForWallet(wallets[w])]),
  ));

  const txHashes = Object.values(walletScriptHashMap)
    .flatMap((walletMap) => Object.values(walletMap).flatMap((h) => h.histories))
    .map((h) => h.tx_hash);

  const transactionMap = await getTransactions(txHashes);

  const nodes = Object.values(transactionMap).map(
    (tx) => ({ name: tx.txid.slice(0, 4), id: tx.txid, tx }),
  );
  const links = await generateLinks(transactionMap, walletScriptHashMap);

  const model = { nodes, links };
  console.log(model);

  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('new client connected');
    ws.on('message', (data) => {
      console.log(`Client has sent us: ${data}`);

      ws.send(JSON.stringify({ model, settings }));
    });
    ws.on('close', () => {
      console.log('the client has disconnected');
    });
    ws.on('error', () => {
      console.log('Some Error occurred');
    });
  });
  console.log('The WebSocket server is running on port 8080');
}
main();

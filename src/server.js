const fs = require('fs');
const ws = require('ws');
const ElectrumClient = require('@mempool/electrum-client');

const loadFile = (filename) => {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
  }
  return '';
};

exports.startServer = async (settingsFile = undefined, walletsFile = undefined) => {
  console.log('Wallets file: ', walletsFile);
  console.log('Settings file: ', settingsFile);

  const userWallets = walletsFile ? loadFile(walletsFile) : {};
  const userSettings = settingsFile ? loadFile(settingsFile) : {};

  const wallets = { ...userWallets, ...loadFile('resources/wallets.json') };
  const settings = { ...userSettings, ...loadFile('resources/settings.json') };

  const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
  await electrum.connect();

  const wss = new ws.WebSocketServer({ port: 8080 });

  const transactionCache = {};

  wss.on('connection', (websocket) => {
    console.log('new client connected');
    websocket.on('message', async (rawData) => {
      const data = JSON.parse(rawData);
      // console.log('Client has sent us:', data);

      const send = (msg) => {
        // console.log('sending ', msg);
        websocket.send(JSON.stringify(msg));
      };

      const { requestId } = data;
      switch (data.requestType) {
        case 'get.settings':
          send({ requestId, result: settings });
          break;

        case 'get.wallets':
          send({ requestId, result: wallets });
          break;

        case 'get.histories': {
          const responses = await electrum.blockchainScripthash_getHistoryBatch(data.parameters);
          const result = responses.map((r) => ({
            scriptHash: r.param,
            transactions: r.result,
          }));
          send({ requestId, result });
        }
          break;

        case 'get.transactions': {
          const transactions = await Promise.all(
            data.parameters.map(
              async (txId) => {
                if (txId in transactionCache) { return transactionCache[txId]; }

                const tx = electrum.blockchainTransaction_get(txId, true);
                transactionCache[txId] = tx;
                return tx;
              },
            ),
          );
          send({ requestId, result: transactions });
        }
          break;

        default:
          console.error(data.requestType, ' not supported');
      }
    });
    websocket.on('close', () => {
      console.log('the client has disconnected');
    });
    websocket.on('error', () => {
      console.log('Some Error occurred');
    });
  });
};
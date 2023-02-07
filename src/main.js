import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import ElectrumClient from '@mempool/electrum-client';

const loadFile = (filename) => {
  try {
    const data = readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
  }
  return '';
};

async function main() {
  const wallets = loadFile('resources/wallets.json');
  const settings = loadFile('resources/settings.json');

  const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
  await electrum.connect();

  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('new client connected');
    ws.on('message', async (rawData) => {
      const data = JSON.parse(rawData);
      // console.log('Client has sent us:', data);

      const send = (msg) => {
        // console.log('sending ', msg);
        ws.send(JSON.stringify(msg));
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
          const histories = await Promise.all(
            data.scriptHashes.map(async (scriptHash) => ({
              scriptHash,
              transactions: await electrum.blockchainScripthash_getHistory(scriptHash),
            })),
          );
          send({ requestId, result: histories });
        }
          break;

        case 'get.transactions': {
          const transactions = await Promise.all(
            data.transactions.map(
              async (txId) => electrum.blockchainTransaction_get(txId, true),
            ),
          );
          send({ requestId, result: transactions });
        }
          break;

        default:
          console.error(data.requestType, ' not supported');
      }
    });
    ws.on('close', () => {
      console.log('the client has disconnected');
    });
    ws.on('error', () => {
      console.log('Some Error occurred');
    });
  });
}

main();

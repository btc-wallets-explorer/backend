const http = require("http");
const express = require("express");
const WebSocket = require("ws");

const fs = require("fs");
const ElectrumClient = require("@mempool/electrum-client");

const loadFile = (filename) => {
  try {
    const data = fs.readFileSync(filename, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
  }
  return "";
};

exports.loadFiles = async (settingsFile, walletsFile) => {
  console.log("Wallets file: ", walletsFile);
  console.log("Settings file: ", settingsFile);

  const userWallets = walletsFile ? loadFile(walletsFile) : [];
  const userSettings = settingsFile ? loadFile(settingsFile) : {};

  const wallets = [...loadFile("resources/wallets.json"), ...userWallets];
  const settings = { ...loadFile("resources/settings.json"), ...userSettings };

  return { wallets, settings };
};

exports.startServer = async (settingsFile, walletsFile, distDir) => {
  const app = express();
  const server = http.createServer(app);

  server.listen(8080, () => {
    console.log("Server running");
  });

  const { settings, wallets } = await this.loadFiles(settingsFile, walletsFile);

  const backendUrl = `${settings.backend.protocol}://${settings.backend.hostname}:${settings.backend.port}`;

  if (distDir) {
    const path = distDir;
    app.get("/", (req, res) => {
      res.sendFile(`${path}/index.html`);
    });

    app.get("/app.js", (req, res) => {
      res.sendFile(`${path}/app.js`);
    });
    app.get("/config.js", (req, res) => {
      res.send(`window.bwe = { 'backend-url': '${backendUrl}' }`);
    });
  }

  const wss = new WebSocket.Server({ server });
  this.startWebSocketProcess(wss, settings, wallets);
};

exports.startWebSocketProcess = async (wss, settings, wallets) => {
  const electrum = new ElectrumClient(
    settings.electrum.port,
    settings.electrum.hostname,
    settings.electrum.protocol,
  );

  await electrum.connect();

  const transactionCache = {};
  // TODO: remove as history changes
  const historiesCache = {};
  // TODO: remove as utxos change
  const utxoCache = {};

  const requestHandler = async (data, send) => {
    const { requestId } = data;

    switch (data.requestType) {
      case "get.settings":
        send({ requestId, result: settings });
        break;

      case "get.wallets":
        send({ requestId, result: wallets });
        break;

      case "get.histories":
        {
          const result = await Promise.all(
            data.parameters.map(async (hash) => {
              if (hash in historiesCache) {
                return historiesCache[hash];
              }

              const history = {
                scriptHash: hash,
                transactions:
                  await electrum.blockchainScripthash_getHistory(hash),
              };

              historiesCache[hash] = history;
              return history;
            }),
          );

          send({ requestId, result });
        }
        break;

      case "get.transactions":
        {
          const transactions = await Promise.all(
            data.parameters.map(async (txId) => {
              if (txId in transactionCache) {
                return transactionCache[txId];
              }

              const tx = electrum.blockchainTransaction_get(txId, true);
              transactionCache[txId] = tx;
              return tx;
            }),
          );

          send({ requestId, result: transactions });
        }
        break;

      case "get.utxos":
        {
          const transactions = await Promise.all(
            data.parameters.map(async (scriptHash) => {
              if (scriptHash in utxoCache) {
                return utxoCache[scriptHash];
              }

              const unspent = {
                scriptHash,
                utxos:
                  await electrum.blockchainScripthash_listunspent(scriptHash),
              };

              utxoCache[scriptHash] = unspent;
              return unspent;
            }),
          );

          send({ requestId, result: transactions });
        }
        break;

      default:
        console.error(data.requestType, " not supported");
    }
  };

  wss.on("connection", (websocket) => {
    console.log("new client connected");
    websocket.on("message", async (rawData) => {
      const data = JSON.parse(rawData);

      const send = (msg) => {
        websocket.send(JSON.stringify(msg));
      };

      try {
        requestHandler(data, send);
      } catch (exception) {
        console.log(exception);
      }
    });
    websocket.on("close", () => {
      console.log("the client has disconnected");
    });
    websocket.on("error", () => {
      console.log("Some Error occurred");
    });
  });
};

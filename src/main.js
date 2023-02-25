const http = require('http');
const express = require('express');
const { program } = require('commander');
const ser = require('./server');

console.log('server version started');

program
  .option('-s, --settings <value>', 'settings file: e.g. settings.json')
  .option('-w, --wallets <value>', 'wallets file: e.g. wallets.json')
  .option('-d, --dist <value>', 'path to frontend bundle (dist dir)');

program.parse();

const options = program.opts();

const app = express();
const server = http.createServer(app);

server.listen(8080, () => {
  console.log('Server running');
});

if (options.dist) {
  const path = options.dist;
  app.get('/', (req, res) => {
    res.sendFile(`${path}/dist/index.html`);
  });

  app.get('/bundle-front.js', (req, res) => {
    res.sendFile(`${path}/dist/bundle-front.js`);
  });
}

ser.startServer(options.settings, options.wallets, server);

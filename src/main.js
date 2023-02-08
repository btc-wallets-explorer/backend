const { program } = require('commander');
const server = require('./server');

program
  .option('-s, --settings <value>', 'settings file: e.g. settings.json')
  .option('-w, --wallets <value>', 'wallets file: e.g. wallets.json');

program.parse();

const options = program.opts();

server.startServer(options.settings, options.wallets);

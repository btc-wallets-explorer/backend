const { program } = require("commander");
const server = require("./server");

console.log("server version started");

program
  .option("-s, --settings <value>", "settings file: e.g. settings.json")
  .option("-w, --wallets <value>", "wallets file: e.g. wallets.json")
  .option("-d, --dist <value>", "path to frontend bundle (dist dir)");

program.parse();

const options = program.opts();

server.startServer(options.settings, options.wallets, options.dist);

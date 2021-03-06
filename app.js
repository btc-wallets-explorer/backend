let bitcoin = require('bitcoinjs-lib');
let bip32 = require('bip32');
const mainnet = bitcoin.networks.mainnet;

function toScriptHash(address) {
	let script = bitcoin.address.toOutputScript(address);
	let hash = bitcoin.crypto.sha256(script);
	let reversedHash = new Buffer(hash.reverse());
	let scriptHash = reversedHash.toString('hex');

	return scriptHash;
}
let root = bip32.fromBase58(xpub);

const child = root.derive(0).derive(0);

const { address } = bitcoin.payments.p2wpkh({
        pubkey: child.publicKey,
        network: mainnet,
    });



console.log(`the addressString is ${address.toString('hex')}`);
let scriptHash = toScriptHash(address);


var net = require('net');
var client = new net.Socket();
client.connect(50001, '127.0.0.1', function() {
	console.log('Connected');
	let rpc = `{"jsonrpc": "2.0", "method": "blockchain.scripthash.get_balance", "id": 0, "params": ["${scriptHash}"]}`;
	console.log(rpc);
	client.write(rpc);
	client.end();
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	client.destroy();
});

client.on('close', function() {
	console.log('Connection closed');
});

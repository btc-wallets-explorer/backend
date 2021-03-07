const fs = require('fs');

let wallets;
try {
    const data = fs.readFileSync('./wallets.json', 'utf8');
    wallets = JSON.parse(data);

} catch (err) {
    console.log(`Error reading file from disk: ${err}`);
}



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



const xpub = wallets['single'].xpubs[0];
function getAddress(xpub, number) {
	let root = bip32.fromBase58(xpub);

	const child = root.derive(0).derive(number);

	const { address } = bitcoin.payments.p2wpkh({
        	pubkey: child.publicKey,
	        network: mainnet,
	    });
	return address;
}



const xpubs = wallets['multi'].xpubs;


function getAddressForMultisig(xpubs, number) {
	let pubkeys = xpubs.map(x => bip32.fromBase58(x).derive(0).derive(number).publicKey);

	pubkeys.sort();
	const { address } = bitcoin.payments.p2wsh({
		redeem: bitcoin.payments.p2ms({ m: 2, pubkeys}),
		
});
	return address;
}

let address = getAddressForMultisig(xpubs, 0);

console.log(`the addressString is ${address}`);
let scriptHash = toScriptHash(address);


var net = require('net');
var client = new net.Socket();
client.connect(50001, '127.0.0.1', function() {
	console.log('Connected');
	let rpc = `{"jsonrpc": "2.0", "method": "blockchain.scripthash.get_history", "id": 0, "params": ["${scriptHash}"]}`;
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

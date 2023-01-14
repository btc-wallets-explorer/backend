import bitcoin from 'bitcoinjs-lib';
import bip32 from 'bip32';

const mainnet = bitcoin.networks.mainnet;

export const toScriptHash = (address) => {
	let script = bitcoin.address.toOutputScript(address);
	let hash = bitcoin.crypto.sha256(script);
	let reversedHash = Buffer.from(hash.reverse());
	let scriptHash = reversedHash.toString('hex');

	return scriptHash;
}

export const getAddress = (xpub, number, change = 0) => {
	let root = bip32.fromBase58(xpub);

	const child = root.derive(change).derive(number);

	const { address } = bitcoin.payments.p2wpkh({
        	pubkey: child.publicKey,
	        network: mainnet,
	    });
	return address;
}

export const getAddressForMultisig = (xpubs, number, change = 0) => {
	let pubkeys = xpubs.map(x => bip32.fromBase58(x).derive(change).derive(number).publicKey);

	pubkeys.sort();
	const { address } = bitcoin.payments.p2wsh({
		redeem: bitcoin.payments.p2ms({ m: 2, pubkeys}),
    });
	return address;
}

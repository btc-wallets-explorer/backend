import bip32 from 'bip32';
import bitcoin from 'bitcoinjs-lib';

const network = bitcoin.networks.bitcoin;

export const toScriptHash = (address) => {
  const script = bitcoin.address.toOutputScript(address);
  const hash = bitcoin.crypto.sha256(script);
  const reversedHash = Buffer.from(hash.reverse());
  const scriptHash = reversedHash.toString('hex');

  return scriptHash;
};

export const getAddress = (xpub, type, number, change = 0) => {
  const root = bip32.fromBase58(xpub);

  const child = root.derive(change).derive(number);

  const p2wpkh = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
    network,
  });

  if (type === 'p2sh-p2wpkh') {
    const { address } = bitcoin.payments.p2sh({
      redeem: p2wpkh,
      network,
    });

    return address;
  }

  return p2wpkh.address;
};

export const getAddressForMultisig = (xpubs, type, number, change = 0) => {
  const pubkeys = xpubs.map((x) => bip32.fromBase58(x).derive(change).derive(number).publicKey);

  pubkeys.sort((a, b) => a.compare(b));
  const { address } = bitcoin.payments.p2wsh({
    redeem: bitcoin.payments.p2ms({ m: 2, pubkeys }),
  });
  return address;
};

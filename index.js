import { readFileSync } from 'fs';
import WebSocket from 'ws';
import { getAddressForMultisig, toScriptHash } from './bitcoin.js';
import ElectrumClient from './deps/electrum-client/index.js';
import { range } from './helpers.js';

async function main() {
    const electrum = new ElectrumClient(50001, 'localhost', 'tcp');
    await electrum.connect();

    // load wallets
    let wallets;
    try {
        const data = readFileSync('./wallets.json', 'utf8');
        wallets = JSON.parse(data);
    } catch (err) {
        console.log(`Error reading file from disk: ${err}`);
    }

    const xpubs = wallets['multi'].xpubs;
    var addresses = range(100).map(index => getAddressForMultisig(xpubs, index));
    var scriptHashes = addresses.map(a => toScriptHash(a));

    var histories = [];
    for (let h of scriptHashes) {
        var hist = await electrum.blockchainScripthash_getHistory(h);

        if (hist.length > 0) {
            histories.push(hist);
        }
    }
    var transactionHashes = histories.map(h => h.map(t => t.tx_hash)).flat();
    const transactions = {};

    for (const hash of transactionHashes) {
        transactions[hash] = await electrum.blockchainTransaction_get(hash, true);
    }
    console.log(Object.keys(transactions).length);

    let links = [];

    for (const transaction of Object.values(transactions)) {
        links = links.concat(transaction.vin.map(vin => ({ source: transaction.txid, target: vin.txid, value: 1 })));

        const tx_list = transaction.vin.map(vin => vin.txid).filter(id => typeof id === 'string');
        for (const tx of tx_list)
            transactions[tx] = await electrum.blockchainTransaction_get(tx, true)
    };

    console.log(Object.keys(transactions).length);


    let id = 0;
    let nodes = Object.keys(transactions).map(tx => ({ id: id++, name: tx }));


    // const model = { nodes, links };
    // console.log(model);
    // const model = {
    //     "nodes": [
    //         { "node": 0, "name": "node0" },
    //         { "node": 1, "name": "node1" },
    //         { "node": 2, "name": "node2" },
    //         { "node": 3, "name": "node3" },
    //         { "node": 4, "name": "node4" }
    //     ],
    //     "links": [
    //         { "source": 0, "target": 2, "value": 2 },
    //         { "source": 1, "target": 2, "value": 2 },
    //         { "source": 1, "target": 3, "value": 2 },
    //         { "source": 0, "target": 4, "value": 2 },
    //         { "source": 2, "target": 3, "value": 2 },
    //         { "source": 2, "target": 4, "value": 2 },
    //         { "source": 3, "target": 4, "value": 4 }
    //     ]
    // };

const model = {
"links": [
{"source":"Agricultural Energy Use","target":"Carbon Dioxide","value":"1.4"},
{"source":"Agriculture","target":"Agriculture Soils","value":"5.2"},
{"source":"Agriculture","target":"Livestock and Manure","value":"5.4"},
{"source":"Agriculture","target":"Other Agriculture","value":"1.7"},
{"source":"Agriculture","target":"Rice Cultivation","value":"1.5"},
{"source":"Agriculture Soils","target":"Nitrous Oxide","value":"5.2"},
{"source":"Air","target":"Carbon Dioxide","value":"1.7"},
{"source":"Aluminium Non-Ferrous Metals","target":"Carbon Dioxide","value":"1.0"},
{"source":"Aluminium Non-Ferrous Metals","target":"HFCs - PFCs","value":"0.2"},
{"source":"Cement","target":"Carbon Dioxide","value":"5.0"},
{"source":"Chemicals","target":"Carbon Dioxide","value":"3.4"},
{"source":"Chemicals","target":"HFCs - PFCs","value":"0.5"},
{"source":"Chemicals","target":"Nitrous Oxide","value":"0.2"},
{"source":"Coal Mining","target":"Carbon Dioxide","value":"0.1"},
{"source":"Coal Mining","target":"Methane","value":"1.2"},
{"source":"Commercial Buildings","target":"Carbon Dioxide","value":"6.3"},
{"source":"Deforestation","target":"Carbon Dioxide","value":"10.9"},
{"source":"Electricity and heat","target":"Agricultural Energy Use","value":"0.4"},
{"source":"Electricity and heat","target":"Aluminium Non-Ferrous Metals","value":"0.4"},
{"source":"Electricity and heat","target":"Cement","value":"0.3"},
{"source":"Electricity and heat","target":"Chemicals","value":"1.3"},
{"source":"Electricity and heat","target":"Commercial Buildings","value":"5.0"},
{"source":"Electricity and heat","target":"Food and Tobacco","value":"0.5"},
{"source":"Electricity and heat","target":"Iron and Steel","value":"1.0"},
{"source":"Electricity and heat","target":"Machinery","value":"1.0"},
{"source":"Electricity and heat","target":"Oil and Gas Processing","value":"0.4"},
{"source":"Electricity and heat","target":"Other Industry","value":"2.7"},
{"source":"Electricity and heat","target":"Pulp - Paper and Printing","value":"0.6"},
{"source":"Electricity and heat","target":"Residential Buildings","value":"5.2"},
{"source":"Electricity and heat","target":"T and D Losses","value":"2.2"},
{"source":"Electricity and heat","target":"Unallocated Fuel Combustion","value":"2.0"},
{"source":"Energy","target":"Electricity and heat","value":"24.9"},
{"source":"Energy","target":"Fugitive Emissions","value":"4.0"},
{"source":"Energy","target":"Industry","value":"14.7"},
{"source":"Energy","target":"Other Fuel Combustion","value":"8.6"},
{"source":"Energy","target":"Transportation","value":"14.3"},
{"source":"Food and Tobacco","target":"Carbon Dioxide","value":"1.0"},
{"source":"Fugitive Emissions","target":"Coal Mining","value":"1.3"},
{"source":"Fugitive Emissions","target":"Oil and Gas Processing","value":"3.2"},
{"source":"Harvest \/ Management","target":"Carbon Dioxide","value":"1.3"},
{"source":"Industrial Processes","target":"Aluminium Non-Ferrous Metals","value":"0.4"},
{"source":"Industrial Processes","target":"Cement","value":"2.8"},
{"source":"Industrial Processes","target":"Chemicals","value":"1.4"},
{"source":"Industrial Processes","target":"Other Industry","value":"0.5"},
{"source":"Industry","target":"Aluminium Non-Ferrous Metals","value":"0.4"},
{"source":"Industry","target":"Cement","value":"1.9"},
{"source":"Industry","target":"Chemicals","value":"1.4"},
{"source":"Industry","target":"Food and Tobacco","value":"0.5"},
{"source":"Industry","target":"Iron and Steel","value":"3.0"},
{"source":"Industry","target":"Oil and Gas Processing","value":"2.8"},
{"source":"Industry","target":"Other Industry","value":"3.8"},
{"source":"Industry","target":"Pulp - Paper and Printing","value":"0.5"},
{"source":"Iron and Steel","target":"Carbon Dioxide","value":"4.0"},
{"source":"Land Use Change","target":"Deforestation","value":"10.9"},
{"source":"Land Use Change","target":"Harvest \/ Management","value":"1.3"},
{"source":"Landfills","target":"Methane","value":"1.7"},
{"source":"Livestock and Manure","target":"Methane","value":"5.1"},
{"source":"Livestock and Manure","target":"Nitrous Oxide","value":"0.3"},
{"source":"Machinery","target":"Carbon Dioxide","value":"1.0"},
{"source":"Oil and Gas Processing","target":"Carbon Dioxide","value":"3.6"},
{"source":"Oil and Gas Processing","target":"Methane","value":"2.8"},
{"source":"Other Agriculture","target":"Methane","value":"1.4"},
{"source":"Other Agriculture","target":"Nitrous Oxide","value":"0.3"},
{"source":"Other Fuel Combustion","target":"Agricultural Energy Use","value":"1.0"},
{"source":"Other Fuel Combustion","target":"Commercial Buildings","value":"1.3"},
{"source":"Other Fuel Combustion","target":"Residential Buildings","value":"5.0"},
{"source":"Other Fuel Combustion","target":"Unallocated Fuel Combustion","value":"1.8"},
{"source":"Other Industry","target":"Carbon Dioxide","value":"6.6"},
{"source":"Other Industry","target":"HFCs - PFCs","value":"0.4"},
{"source":"Pulp - Paper and Printing","target":"Carbon Dioxide","value":"1.1"},
{"source":"Rail - Ship and Other Transport","target":"Carbon Dioxide","value":"2.5"},
{"source":"Residential Buildings","target":"Carbon Dioxide","value":"10.2"},
{"source":"Rice Cultivation","target":"Methane","value":"1.5"},
{"source":"Road","target":"Carbon Dioxide","value":"10.5"},
{"source":"T and D Losses","target":"Carbon Dioxide","value":"2.2"},
{"source":"Transportation","target":"Air","value":"1.7"},
{"source":"Transportation","target":"Rail - Ship and Other Transport","value":"2.5"},
{"source":"Transportation","target":"Road","value":"10.5"},
{"source":"Unallocated Fuel Combustion","target":"Carbon Dioxide","value":"3.0"},
{"source":"Unallocated Fuel Combustion","target":"Methane","value":"0.4"},
{"source":"Unallocated Fuel Combustion","target":"Nitrous Oxide","value":"0.4"},
{"source":"Waste","target":"Landfills","value":"1.7"},
{"source":"Waste","target":"Waste water - Other Waste","value":"1.5"},
{"source":"Waste water - Other Waste","target":"Methane","value":"1.2"},
{"source":"Waste water - Other Waste","target":"Nitrous Oxide","value":"0.3"}
] ,
"nodes": [
{"name":"Energy"},
{"name":"Industrial Processes"},
{"name":"Electricity and heat"},
{"name":"Industry"},
{"name":"Land Use Change"},
{"name":"Agriculture"},
{"name":"Waste"},
{"name":"Transportation"},
{"name":"Other Fuel Combustion"},
{"name":"Fugitive Emissions"},
{"name":"Road"},{"name":"Air"},
{"name":"Rail - Ship and Other Transport"},
{"name":"Residential Buildings"},
{"name":"Commercial Buildings"},
{"name":"Unallocated Fuel Combustion"},
{"name":"Iron and Steel"},
{"name":"Aluminium Non-Ferrous Metals"},
{"name":"Machinery"},
{"name":"Pulp - Paper and Printing"},
{"name":"Food and Tobacco"},
{"name":"Chemicals"},
{"name":"Cement"},
{"name":"Other Industry"},
{"name":"T and D Losses"},
{"name":"Coal Mining"},
{"name":"Oil and Gas Processing"},
{"name":"Deforestation"},
{"name":"Harvest \/ Management"},
{"name":"Agricultural Energy Use"},
{"name":"Agriculture Soils"},
{"name":"Livestock and Manure"},
{"name":"Rice Cultivation"},
{"name":"Other Agriculture"},
{"name":"Landfills"},
{"name":"Waste water - Other Waste"},
{"name":"Carbon Dioxide"},
{"name":"HFCs - PFCs"},
{"name":"Methane"},
{"name":"Nitrous Oxide"}
] }

    const wss = new WebSocket.Server({ port: 8080 })

    wss.on("connection", ws => {
        console.log("new client connected");
        ws.on("message", data => {
            console.log(`Client has sent us: ${data}`);

            ws.send(JSON.stringify(model));
        });
        ws.on("close", () => {
            console.log("the client has connected");
        });
        ws.onerror = function () {
            console.log("Some Error occurred")
        }
    });
    console.log("The WebSocket server is running on port 8080");

};
main();



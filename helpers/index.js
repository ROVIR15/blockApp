const {web3} = require('../config/web3_conn');
const ElectionAbi = require("../artifacts/Election.json");
const BallotAbi = require('../artifacts/Ballot.json');
const {config: {default_account, private_key}} = require('../config/web3.conf.json');

async function sendTransaction(data, privateKey){
    let gas = await web3.eth.estimateGas(data);
    let nonce = await web3.eth.getTransactionCount(default_account)
    data = {...data, gas: gas, nonce: nonce, gasPrice: web3.utils.toWei('2.5', 'gwei')}
    let sign = await web3.eth.accounts.signTransaction(data,privateKey);
    let send = await web3.eth.sendSignedTransaction(sign.rawTransaction);
    console.log(send.transactionHash)
    return send.transactionHash    
}

module.exports = {
    decrypt: async function(encrypted){
        let wait = await web3.eth.accounts.decrypt(encrypted, "password");
        return wait;    
    },
    sendTransaction,
    transactionReceipt: async function(tx_hash){
        let receipt = await web3.eth.getTransactionReceipt(tx_hash);
        return receipt
    },
    toBigNumber: async function(number){
        let conv =  await web3.utils.toBN(number);
        return conv
    },
    createElection: async function(admin, name, sender, privateKey){
        let namebytes32 = await web3.utils.asciiToHex(name);
        let bytecode = '0x' + ElectionAbi.evm.bytecode.object;
        let contract = new web3.eth.Contract(ElectionAbi.abi);
        let deployed = await contract.deploy({data: bytecode, arguments: [admin, namebytes32]})
        let gas = await deployed.estimateGas();
        bytecode = await deployed.encodeABI();
        let nonce = await web3.eth.getTransactionCount(sender);
        let gasPrice = web3.utils.toWei('1', 'gwei')
        let gasLimit = "500000"
        let signed = await web3.eth.accounts.signTransaction({from: sender, data: bytecode, gas: gas, gasPrice: gasPrice, gasLimit: gasLimit, nonce: nonce}, privateKey);
        let send = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        return({transaction_hash: send.transactionHash, contract_address: send.contractAddress})    
    },
    createBallot: async function(admin, election, id, sender, privateKey){
        if(!sender || !private_key) throw new Error("sender should be defined first")
        let idbytes32 = await web3.utils.asciiToHex(id);
        let bytecode = '0x' + BallotAbi.evm.bytecode.object;
        let contract = new web3.eth.Contract(BallotAbi.abi);
        let deployed = await contract.deploy({data: bytecode, arguments: [idbytes32, admin, election]})
        let gas = await deployed.estimateGas();
        bytecode = await deployed.encodeABI();
        let nonce = await web3.eth.getTransactionCount(sender);
        let gasPrice = web3.utils.toWei('1', 'gwei')
        let gasLimit = "500000"
        let signed = await web3.eth.accounts.signTransaction({from: sender, data: bytecode, gas: gas, gasPrice: gasPrice, gasLimit: gasLimit, nonce: nonce}, privateKey);
        let send = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        console.log(send.transactionHash)
        return{tx: send.transactionHash, address: send.contractAddress}
    },
    createandencrypt: async function(roles){
        let newAccount = await web3.eth.accounts.create();
        let encrypt = await web3.eth.accounts.encrypt(newAccount.privateKey, "password")
        let value;
        if(roles === 'voter') value = "0.000000000001"
        if(roles === 'admin') value = "0.01"
        let data = {from: default_account, to: newAccount.address, value: web3.utils.toHex(web3.utils.toWei(value, 'ether'))}
        let send = await sendTransaction(data, private_key)
        return {enc: encrypt, txHash: send, account: newAccount.address}
    }, 
}
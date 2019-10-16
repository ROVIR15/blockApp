const {web3} = require('../config/web3_conn');

module.exports = class Base {

    async createOpt(sender, contractAddress, instance, comp = 0){
        let bytecode = instance.encodeABI();
        let nonce = await web3.eth.getTransactionCount(sender)+comp;
        let gas = await instance.estimateGas();
        this.opt = {
            from: sender, 
            to: contractAddress,
            nonce: nonce,
            gas: gas,
            gasPrice: web3.utils.toWei('1', 'gwei'),
            data: bytecode
        }
        return this.opt;
    }

    async call(contractMethods){
        return await contractMethods.call();
    }

    async send(contractMethods){
        return contractMethods.send();
    }
    
    async signTransaction(privateKey){
        return await web3.eth.accounts.signTransaction(this.opt, privateKey);
    }

    async sendSignedTransaction(rawTx){
        return await web3.eth.sendSignedTransaction(rawTx)
    }
}
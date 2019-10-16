const {web3} = require ('../config/web3_conn');
const Base = require('../worker/web3.methods');
const Creator = require('../artifacts/VotingCreator.json');

module.exports = class Creator extends Base {

    constructor(contract, sender) {
        this.sender = sender;
        this.privateKey = privateKey;
        this.abi = Creator.abi;
        this.owner = new web3.eth.Contract(this.abi, contract);
    }

    async createElection(_name){
        const Creator = this.owner;
        let name = await web3.toHex(_name);
        const instance = await Creator.methods.createVoting(this.sender, name);
        let callRes = await callRes(instance);
        createOpt(this.sender, Creator.address, instance);
        let sign = await signTransaction(this.privateKey);
        return{res: callRes, TxHash: sign};
    }

    async responsiblePerson(_someone, _id, _electionAddress){
        const Creator = this.owner;
        let id = await web3.toHex(_id);
        let instance = await Creator.methods.addResponsiblePerson(_someone, id, _electionAddress);
        creatorOpt(this.sender, Creator.address, instance);
        let sign = await signTransaction(this.privateKey);
        return sign;
    }

}
const {web3} = require ('../config/web3_conn');
const Base = require('../worker/web3.methods');
const ElectionAbi = require('../artifacts/Election.json').abi

module.exports = class Election extends Base{
    
    constructor(sender, privateKey, electionAddress){
        super();
        this.abi = ElectionAbi;
        this.election = new web3.eth.Contract(this.abi, electionAddress)
        this.sender = sender;
        this.pk = privateKey;
    }

    async getElectionInfo(order){
        const Election = this.election
        let instance = await Election.methods.candidates(order)
        let callRes = await Base.prototype.call(instance);
        return callRes
    }

    async getWinner(){
        const Election = this.election
        let instance = await Election.methods.getWinner();
        let callRes = await Base.prototype.call(instance)
        return callRes
    }

    async authorizedVoter(address){
        const Election = this.election;
        let instance = await Election.methods.authorizedVoter(address);
        let callRes = await Base.prototype.call(instance);
        await Base.prototype.createOpt(this.sender, Election.options.address, instance, 1);
        let sign = await Base.prototype.signTransaction(this.pk)
        let send = await Base.prototype.sendSignedTransaction(sign.rawTransaction)
        return {res: callRes, txHash: send.transactionHash}
    }

    async createNewBallot(_address){
        const Election = this.election;
        let instance = await this.election.methods.createNewBallot(_address);
        let callRes = await Base.prototype.call(instance);
        await Base.prototype.createOpt(this.sender, Election.options.address, instance);
        let sign = await Base.prototype.signTransaction(this.pk);
        let send = await Base.prototype.sendSignedTransaction(sign.rawTransaction)
        return {res: callRes, txHash: send.transactionHash};
    }

    async addCandidate(name){
        const Election = this.election;
        let instance = await this.election.methods.addCandidate(name);
        if(!Election.options.address) throw new Error("Contract address not found")
        await Base.prototype.createOpt(this.sender, Election.options.address, instance);
        let sign = await Base.prototype.signTransaction(this.pk);
        let send = await Base.prototype.sendSignedTransaction(sign.rawTransaction)
        return send.transactionHash;
    }
}
const {web3} = require('../config/web3_conn')
const Base = require('../worker/web3.methods');
const BallotAbi = require('../artifacts/Ballot.json').abi

module.exports = class Ballot extends Base{
    constructor(sender, privateKey, ballotAddress){
        super();
        this.abi = BallotAbi;
        this.ballot = new web3.eth.Contract(this.abi, ballotAddress);
        this.pk = privateKey;
        this.sender = sender
    }

    async getID() {
        const Ballot = this.ballot;
        const instance = await Ballot.methods.getId();
        let res = await Base.prototype.call(instance);
        return res;
    }
    
    async commitVote(_vote){
        const Ballot = this.ballot;
        const vote = web3.utils.toHex(_vote).padEnd(66, '0')
        if(!vote) return new Error("vote key still error")
        const instance = await Ballot.methods.commitVote(vote)
        let callRes = await Base.prototype.call(instance);
        await Base.prototype.createOpt(this.sender, Ballot.address, instance);
        let sign = await Base.prototype.signTransaction(this.pk);
        Base.prototype.sendSignedTransaction(sign.rawTransaction)
        return{res: callRes, txHash: sign.transactionHash};
    }

    async revealVote(_secretKey, candidateId){
        const Ballot = this.ballot;
        let secretKey = web3.utils.toHex(_secretKey).padEnd(66, '0')
        let instance = await Ballot.methods.revealVote(secretKey, candidateId);
        let callRes = await Base.prototype.call(instance);
        await Base.prototype.createOpt(this.sender, Ballot.address, instance);
        let sign = await Base.prototype.signTransaction(this.pk);
        Base.prototype.sendSignedTransaction(sign.rawTransaction)
        return{res: callRes, txHash: sign.transactionHash};
    }
}

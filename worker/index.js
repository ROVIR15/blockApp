const {config: {default_account, private_key}} = require('../config/web3.conf.json');

const ElectionModels = require('../new-models/Election');
const TransactionStorage = require('../new-models/TransactionStorage');
const Users = require('../new-models/User')
const Voter = require('../new-models/Voter');

const {createBallot, createElection, decrypt, createandencrypt,sendTransaction, transactionReceipt} = require('../helpers/index');

const Ballot = require('../election/ballot');
const Election = require('../election/election.publisher');

async function newGetElectionContractAddress(election_id){
  return await ElectionModels.findOne({_id: election_id}, function(err, found){
    if(err || !found) return new Error("Cannot find anything else!");
    return found.contract
  })
}

async function newGetBallotContractAddress(ballot_id){
    return await Voter.findOne({_id: ballot_id}, function(err, found){
      if(err || !found) return new Error("Cannot find anything else!");
      return found.contract
    })
}
  

async function getEncryptedAccount(id){
    let enc;
    try {
        let {encpk} = await Users.findById({_id: id})
        enc = encpk;        
    } catch (error) {
        console.error(error);
    }
    return enc;
}

function newSaveTransaction(election_id, arr, cb){
  if(arr.length === 0 || !election_id) return new Error("array couldn't send as empty")
  TransactionStorage.findOne({related_id: election_id}, function(err, get){
    if(err || !get) console.error("Not Found");
    TransactionStorage.updateOne({_id: get._id}, {$push : {transactions: {$each : arr}}}, function(err, info){
      if(err) return(false)
      return(true)
    })  
  })
}

function newUpdateVoter(id, {options}, cb){
    Voter.findById({_id: id}, function(err, res){
      if (err || !res) return new Error("Something goes wrong", err);
      return Voter.updateOne({_id: id}, {$set: {contractAddress: options.contractAddress}}, function(err, info){
        if(err) return false
        return true;  
      })
    })
}

async function newUpdateUsers(id, {options}, cb){
  Users.findOne({_id: id}, async function(err, ok){
    if(err || !ok) cb(false)
    else {
      Users.updateOne({_id: ok._id}, {$set: options}, async function(err, info){
        if(err) cb(false)
        cb(true);
      })    
    }
  })
}

function storeElectionContract(transaction_hash, election_id){
  setTimeout(function() {
    transactionReceipt(transaction_hash).then(res => {
      ElectionModels.updateOne({_id: election_id}, {$set: {transaction_hash: transaction_hash, contractAddress: res.contractAddress}}, function(err, info){
        if(err || !info.nModified) return({ok: false, message: {error: err}});
        return({ok: true, message: "Successfully update"})
      })
    }).catch(err => {
      return({ok: false, message: err})
    })
  })
}

module.exports = {
    activate: {
        voter: async function(msg, cb){
            /**
             * @param {String} administrator_id
             * @param {String} election_id
             * @param {Object} voter it is voter data include identification_id;
             */
            var temp = JSON.parse(msg.content.toString())
            console.log(`process creating ballot for ${temp.voter.name}`)
            let encpk = await getEncryptedAccount(temp.administrator_id);
            if(!temp.voter) cb(false)
            createandencrypt("voter").then(async info => {
              let admin = await decrypt(encpk)
              console.log(`New address for voter name ${temp.voter.name} is ${info.account}`)
              var {contractAddress} = await newGetElectionContractAddress(temp.election_id)
              createBallot(info.account, contractAddress, temp.voter.identification_id, admin.address, admin.privateKey).then(async ballot=> {
                var contract = new Election(admin.address, admin.privateKey, contractAddress);
                  newUpdateUsers(temp.voter._id, {options: {encpk: info.enc}}, function(ok){
                    if(!ok) {
                      cb(false)
                      throw new Error("Failed to save dataa")
                    } 
                    console.log(`Ballot created at ${ballot.address}`)
                    console.log(`Next trying to insert ballot to election contract...`)      
                    contract.createNewBallot(ballot.address).then(async txHash1 => {
                      newUpdateVoter(temp.voter._id, {options: {contractAddress: ballot.address}})          
                      console.log(`Next trying to authorized ballot to election contract...`)      
                      contract.authorizedVoter(ballot.address).then(async txHash2 => {
                        newSaveTransaction(temp.election_id, [txHash1.txHash, txHash2.txHash]);
                        console.log(`process done transaction hash: ${[txHash1, txHash2]}`)
                        if(txHash1 && txHash2) cb(true);
                      })
                    })
                  })
              })
            })          
        },
        candidate: async function(msg, cb){
            /**
             * @param {String} administrator_id
             * @param {String} election_id
             * @param {Object} candidate include name and;
             */
            var temp = JSON.parse(msg.content.toString())
            console.log("start insert candidate to smart contract with name: " + temp.index)
            let encpk = await getEncryptedAccount(temp.administrator_id)
            if(!encpk) cb(false)
            let admin = await decrypt(encpk)
            var {contractAddress} = await newGetElectionContractAddress(temp.election_id)
            if(!contractAddress) console.log(contractAddress, admin)
            var contract = new Election(admin.address, admin.privateKey, contractAddress);
            console.log("Trying to insert candidate to smart contract....", contractAddress);
            let {name} = temp.candidate;
            let txHash = await contract.addCandidate(name)
            newSaveTransaction(temp.election_id, [txHash], function(ok){
              if(ok) cb(true, txHash);
              else cb(false)
            })  
        }
    },
    create: {
        election: async function(msg, cb){
            /**
             * @param {String} administrator_id
             * @param {String} election_id
             * @param {String} election_name
             */
            var temp = JSON.parse(msg.content.toString())
            console.log("register election", temp)
            let newAccount = await createandencrypt("admin");
            newUpdateUsers(temp.administrator_id, {options: {encpk: newAccount.enc}}, async function(updated){
              if(updated) {              
                let newElectionContract = await createElection(newAccount.account, temp.election_name, default_account, private_key);
                let {transaction_hash} = newElectionContract
                console.log("storing transaction hash...")
                newSaveTransaction(temp.election_id, [transaction_hash])
                console.log("storing contract address of election...")
                storeElectionContract(transaction_hash, temp.election_id, false);
                console.log("completed");
                cb(true)
              } else
                cb(false)
            })
        },
    },
    voter: {
        vote: async function(msg, cb){
            /**
             * @param {String} voter.id include voter data for give voting like vote, voteKey
             * @param {String} vote
             * @param {String} voteKey
             */
            var temp = JSON.parse(msg.content.toString())
            let encpk = getEncryptedAccount(temp.voter.id)
            let ballotAddress = newGetBallotContractAddress(temp.voter.id)
            let account = await decrypt(encpk)
            const contract = new Ballot(account.address, account.privateKey, ballotAddress)
            try {
            let committx = await contract.commitVote(temp.vote);
            newSaveTransaction(id_kegiatan, [committx.txHash, revealtx.txHash]);      
            setTimeout(async function(){
                let revealtx = await contract.revealVote(temp.voteKey, temp.no_urut-1)
                newSaveTransaction(id_kegiatan, [committx.txHash, revealtx.txHash]);        
            }, 30000)
            } catch (error) {
            console.log("Error", error);
            }  
            cb(true);
        }
    }
}  
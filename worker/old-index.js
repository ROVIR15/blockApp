const {config: {default_account, private_key}} = require('../config/web3.conf.json');

//Database models
const Pemilih = require('../models/Pemilih');
const Kandidat = require('../models/Kandidat');
const DetailKegiatan = require('../models/DetailKegiatanSchema');
const Kegiatans = require('../models/KegiatanSchema');

//New Database Models
const TransactionStorage = require('../new-models/TransactionStorage');
const Voter = require('../new-models/Voter');
const ElectionModels = require('../new-models/Election');

//methods
const {createBallot, createElection, decrypt, createandencrypt,sendTransaction, transactionReceipt} = require('../helpers/index');

//Contract Interfaces;
const Ballot = require('../election/ballot');
const Election = require('../election/election.publisher');

// A worker that acks messages only if processed succesfully
function newSaveTransaction(election_id, arr){
  if(arr.length === 0 || !id_kegiatan) return new Error("array couldn't send as empty")
  TransactionStorage.updateOne({related_id: election_id}, {$push : {transaction: {$each : arr}}}, function(err, info){
    if(err) return({success: false, message: "Something goes wrong!"})
    return({success: true, message:{rsmessage: { error : false, text : "Succesfully adding voters as new Users in system"}}})
  })
}

function saveTransaction(id_kegiatan, arr){
  if(arr.length === 0 || !id_kegiatan) return new Error("array couldn't send as empty")
  return DetailKegiatan.updateOne({id_kegiatan: id_kegiatan}, {$push : {transaction: {$each : arr}}}, function(err, updated){
      if(err) return({success: false, message: "Something goes wrong!"})
      if(updated.nModified === 0) return({success: false, message: "Nothing has updated"})
      return({success: true, message:{rsmessage: { error : false, text : "Succesfully adding voters as new Users in system"}}})
  })  
}

function newUpdatePemilih(id, newContractAddress){
  Voter.findById({_id: id}, function(err, res){
    if (err || !res) return new Error("Something goes wrong", err);
    return Voter.updateOne({_id: id}, {$set: {contract: newContractAddress}}, function(err, info){
      if(err) return({success: false, message:{error: err}});
      return({success: true, message: {data: user}});  
    })
  })
}

function updatePemilih(id, new_instances){
  Pemilih.findOne({_id: id_pemilih}, function(err, res){
    if (err || !res) return new Error("Something goes wrong", err);
    var obj = res.voteTxHash
    obj = Object.assign(obj, new_instances);
    return Pemilih.update({_id: id}, {$set: {voteTxHash: obj}}, function(err, user){
      if(err) return res.json({success: false, message:{error: err}});
      if(user.nModified === 0) return res.json({success: false, message:{error: "user not found"}});
      return res.json({success: true, message: {data: user}});  
    })
  })
}

function updateKandidat(id, txHash){
  return Kandidat.updateOne({ _id: id }, { $set:  {transaction_hash: txHash, locked: true} }).exec(function(err, Candidate){
    if(err || Candidate.nModified === 0) return new Error("Kandidat doesn't recognized by system")
    return true;
  });
}

async function newGetElectionContractAddress(election_id){
  return await ElectionModels.findOne({_id: election_id}, function(err, found){
    if(err || !found) return new Error("Cannot find anything else!");
    return found.contract
  })
}

async function getElectionContractAddress(election_id){
  return await Kegiatans.findOne({_id: election_id}, function(err, found){
    if(err || !found) return new Error("Cannot find anything else!");
    return found
  })
}

async function newGetBallotContractAddress(ballot_id){
  return await ElectionModels.findOne({_id: ballot_id}, function(err, found){
    if(err || !found) return new Error("Cannot find anything else!");
    return found.contract
  })
}

async function getBallotContractAddress(ballot_id){
  return await Pemilih.findOne({_id: ballot_id}, function(err, found){
    if(err || !found) return new Error("Cannot find anything else!");
    return found
  });
}

function storeElectionContract(transaction_hash, election_id){
  setTimeout(function() {
    transactionReceipt(transactionHash).then(res => {
      ElectionModels.updateOne({_id: election_id}, {$set: {transaction_hash: transaction_hash, contract: res.contractAddress}}, function(err, info){
        if(err || !info.nModified) return({ok: false, message: {error: err}});
        return({ok: true, message: "Successfully update"})
      })
    }).catch(err => {
      return({ok: false, message: err})
    })
  })
}

function storeBallotContract(transaction_hash, id){
  setTimeout(function() {
    transactionReceipt(transactionHash).then(res => {
      Voter.updateOne({_id: id}, {$set: {contract: res.contractAddress}}, function(err, info){
        if(err || !info.nModified) return({ok: false, message: {error: err}});
        return({ok: true, message: "Successfully update"})
      })
    }).catch(err => {
      return({ok: false, message: err})
    })
  })
}

function saveContractAddress(transactionHash, id, voter = true){
  setTimeout(function() {
    transactionReceipt(transactionHash).then(res => {
      let {contractAddress} = res
      if(voter) return Pemilih.updateOne({ _id: id },{$set: {contract_address: contractAddress}}).catch(function(err){console.error(err)});
      return Kegiatans.updateOne({_id: id}, {$set: {electionActive: true, contract_address: contractAddress, transaction_hash: transactionHash}}, function(err, event){
        if(err || event.nModified != 0) return new Error("Something goes wrong!");
        return true;
      });  
    })
  }, 60000);
}

module.exports = {
    /**
      * @param voter_name;
      * @param voter_id;
      * @param encrypted_account by web3;
      * @param id_kegiatan;
      * @param ballot_address is address of a ballot smart-contract in Blockchain Network;
      * @param election_address is address of a election smart-contract in blockchain network;
    **/
  vote: async function (msg, cb) {
    var temp = JSON.parse(msg.content.toString())
    let account = await decrypt(temp.encpk)
    const contract = new Ballot(account.address, account.privateKey, temp.ballot_address)
    try {
      let committx = await contract.commitVote(temp.vote);
      // updatePemilih(id_pemilih, {commitVote: committx.txHash});
      // saveTransaction(id_kegiatan, [committx.txHash, revealtx.txHash]);
      newSaveTransaction(id_kegiatan, [committx.txHash, revealtx.txHash]);      
      setTimeout(async function(){
        let revealtx = await contract.revealVote(temp.voteKey, temp.no_urut-1)
        // updatePemilih(id_pemilih, {revealVote: revealtx.txHash});
        // saveTransaction(id_kegiatan, [committx.txHash, revealtx.txHash]);  
        newSaveTransaction(id_kegiatan, [committx.txHash, revealtx.txHash]);        
      }, 30000)
    } catch (error) {
      console.log("Error", error);
    }  
    cb(true);
  },
  create: {
    account: async function(msg, cb){
      var temp = JSON.parse(msg.content.toString())
      console.log("create account", temp.nama);
      let {enc, account} = await createandencrypt(temp.role);
      Users.update({_id: temp._id}, {$set : {encpk: enc}}, function(err, res){
        if(err || res.nModified === 0) throw new Error("Something bad happened :(");
        cb(true, {enc, account});
      })
    },
    /**
     * @param account_address of the ballot owner
     * @param contract_address of election smart contract 
     * @param voter_id_ktp
     * @param voter_id
     * @param admin_account_address
     * @param admin_private_key;
    **/
    ballot:async function(msg, cb){
      let temp = JSON.parse(msg.content.toString());
      let admin = await decrypt(temp.admin_encpk);
      let {contractAddress} = await newGetElectionContractAddress(temp.voter.id_kegiatan);      
      // let {contract_address} = await getElectionContractAddress(temp.voter.id_kegiatan);
       setTimeout(async function(){
       console.log("create ballot", temp.voter.id_ktp)
        let txHash = await createBallot(temp.voter.account_address, contractAddress, temp.voter.id_ktp, admin.address, admin.privateKey)
        storeBallotContract(txHash, temp._id);
        // saveContractAddress(txHash, temp._id, true);
        cb(true, txHash);
      },1000*temp.index)
    },
    election: async function(msg, cb){
      setTimeout(function(){
        let temp = JSON.stringify(msg.content.toString());
        createBallot(temp.account, contract_address, temp.id_ktp, admin.address, admin.privateKey).then((res)=> {
          storeElectionContract(res.txHash, temp.id);
          // saveContractAddress(res.txHash, temp.id, true);
        })
      },80000)
    }
  },
  final: {
    step : async function(){

    }
  },
  /**
   * @callback requestCallback
   * @param {Object} msg 
   * this method is use for accessing smart contract method which is
   * insert ballot to election smart contract
   * @param {string} id_kegiatan
   * @param {Object} encpk - the encrypted account and private from an admin of election
   * @param {String} ballot_address
   * @param {String} voter_id
   */
  insertBallot:  function(msg, cb){
    setTimeout(async function(){
      var temp = JSON.parse(msg.content.toString())
      // var {contract_address} = await getElectionContractAddress(id_kegiatan)
      var {contractAddress} = await newGetElectionContractAddress(id_kegiatan)
      let account = await decrypt(temp.encpk)  
      var contract = new Election(account.address, account.privateKey, contractAddress);
      let {txHash} = await contract.createNewBallot(temp.ballot_address);
      // updatePemilih(voter._id, {insert_ballot: txHash});
      newUpdatePemilih(temp.voter_id)
      newSaveTransaction(id_kegiatan, [txHash])
      // saveTransaction(id_kegiatan, [txHash]);
      cb(true, txHash)
    }, 30000);
  },
  /**
   * @param {Object} msg
   * @callback respond a callback
   * @param {String} id_kegiatan - the id of an election
   * @param {Object} encpk - the encrypted account and private from an admin of election
   * @param {String} ballot_address - the address of a ballot voter in blockchain network
   * @param {String} voter_id - the id of a voter
   */
  auth : {
    voter: async function(msg, cb){
      var temp = JSON.parse(msg.content.toString())
      // var {contract_address} = await getElectionContractAddress(id_kegiatan)
      var {contractAddress} = await newGetElectionContractAddress(id_kegiatan)
      let account = await decrypt(temp.encpk)  
      var contract = new Election(contractAddress, account.privateKey, contractAddress);
      let {txHash} = await contract.authorizedVoter(temp.ballot_address);
      // updatePemilih(voter._id, {auth_ballot: txHash});
      newSaveTransaction(id_kegiatan, [txHash]);
      cb(true, txHash)
    }
  },
  lock : {
      /**
      * @param candidate_name;
      * @param candidate_id;
      * @param encrypted_account by web3;
      * @param id_kegiatan;
      * @param election_address is address of a election smart-contract in blockchain network;
      **/
    candidate: async function(msg, cb) {
      var temp = JSON.parse(msg.content.toString())
      console.log("start insert candidate to smart contract with name: " + temp.nama_kandidat)
      let account = await decrypt(temp.encpk)
      // var {contract_address} = await getElectionContractAddress(temp.id_kegiatan)
      var {contractAddress} = await newGetElectionContractAddress(temp.id_kegiatan)
      var contract = new Election(account.address, account.privateKey, contractAddress);
      console.log("Trying to insert candidate to smart contract....", contractAddress);
      let {id_kandidat, nama_kandidat} = temp;
      let txHash = await contract.addCandidate(nama_kandidat)
      // updateKandidat(id_kandidat, txHash)
      newSaveTransaction(temp.id_kegiatan, [txHash])
      // saveTransaction(temp.id_kegiatan, [txHash])
      cb(true, txHash);
    },
    /**
      * @param voter_name;
      * @param voter_id;
      * @param encrypted_account by web3;
      * @param id_kegiatan;
      * @param ballot_address is address of a ballot smart-contract in Blockchain Network;
      * @param election_address is address of a election smart-contract in blockchain network;
    **/
    voter: async function(msg, cb) {
      var temp = JSON.parse(msg.content.toString())
      var {voters, id_kegiatan, encpk, election_address} = temp
      let account = await decrypt(encpk)  
      console.log("Voter", temp);
      var {contract_address} = await getElectionContractAddress(id_kegiatan)
      var contract = new Election(account.address, account.privateKey, contractAddress);
      voters.map(async function(voter, index){
        setTimeout(async function(){
          let insertBallot =  await contract.createNewBallot(voter.ballot_address)
          // updatePemilih(voter._id, {insert_ballot: insertBallot.txHash});
          saveTransaction(id_kegiatan, [insertBallot.txHash]);
          newSaveTransaction(id_kegiatan, [insertBallot.txHash]);
          setTimeout(async function() {
            let authBallot = await contract.authorizedVoter(voter.ballot_address);
            // updatePemilih(voter._id, {auth_ballot: authBallot.txHash});
            newSaveTransaction(id_kegiatan, [authBallot.txHash]);
          },1000);
        }, 30000*index)
      })
      cb(true);
    }
  },
  register: {
    /** 
     * @description this method is used for create new election event that has been registered in conventional database
     * @param encrypted_account
     * @param election_name
     * @param id_kegiatan
     * @param default_account is the address of owner of election platform
     * @param private_key is the private key of default account address
    **/
    election: async function(msg, cb){
      //registering new election to system
      var temp = JSON.parse(msg.content.toString())
      console.log("register election", temp)
      // let account = await decrypt(temp.encpk)  
      // let newElectionContract = await createElection(account.address, temp.election_name, default_account, private_key);
      // let {transaction_hash} = newElectionContract
      console.log("storing transaction hash...")
      // newSaveTransaction(temp.id_kegiatan, [transaction_hash])
      // saveTransaction(temp.id_kegiatan, [transaction_hash]);
      console.log("storing contract address of election...")
      // storeElectionContract(transaction_hash, temp.id_kegiatan, false);
      // saveContractAddress(transaction_hash, temp.id_kegiatan, false);
      console.log("completed");
      cb(true);
    }
  }
}
const amqp = require('amqplib/callback_api');
const amqurl = require('./config/index').AMQURL;
const mongoose = require('mongoose');
const MongoURL = require('./config/index').MONGOURL;

mongoose.connect(MongoURL, function(err, con){
    if(err) console.log("Cannot make connection");
    console.log("MongoDB Connected");
})

const {web3} = require('./config/web3_conn');
const {vote,
       register,
       lock,
       create
      } = require('./worker');

web3.eth.getBlockNumber().then(console.log)

var amqpConn = null;
function start() {
  amqp.connect(amqurl, function(err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      return setTimeout(start, 1000);
    }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function() {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });
    console.log("[AMQP] connected");
    amqpConn = conn;
    whenConnected();
  });
}

function whenConnected() {
  startWorker();
  startPublisher();
}

function closeOnErr(err) {
  if (!err) return false;
  console.error("[AMQP] error", err);
  amqpConn.close();
  return true;
}

// A worker that acks messages only if processed succesfully
function startWorker() {
  amqpConn.createChannel(function(err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function(err) {
      console.error("[AMQP] channel error", err.message);
    });

    ch.on("close", function() {
      console.log("[AMQP] channel closed");
    });

    ch.prefetch(10);
    //Voter Worker Section//

    ch.assertQueue("activate-voter", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("activate-voter", processActivationVoter, {noAck: false});
      console.log("Voter worker is started");
    })

    ch.assertQueue("register-voter", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("register-voter", processRegisterVoter, {noAck: false});
      console.log("Voter worker is started");
    })

    ch.assertQueue("create-account-voter", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("create-account-voter", processCreateAccount, {noAck: false});
      console.log("Create voter worker is started");
    })

    ch.assertQueue("create-ballot", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("create-ballot", processCreateBallot, {noAck: false});
      console.log("Voter worker is started");
    })

    ch.assertQueue("finalization-voter", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("finalization-voter", processFinalizationVoter, {noAck: false});
      console.log("Finalization worker is started");
    })

    ch.assertQueue("auth-voter", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("auth-voter", processAuthVoter, {noAck: false});
      console.log("Auth worker is started");
    })

    //Election
    ch.assertQueue("register-election", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("register-election", processMsgElection, {noAck: false});
      console.log("Election worker is started");
    })

    //Candidates
    ch.assertQueue("lock-candidates", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("lock-candidates", processMsgCandidate, {noAck: false});
      console.log("Candidate worker is started");
    })

    ch.assertQueue("reg-candidates", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("reg-candidates", processRegCandidate, {noAck: false});
      console.log("Candidate worker is started");
    })

    ch.assertQueue("activate-candidates", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("activate-candidates", processActivationCandidate, {noAck: false});
      console.log("Candidate activation is started");
    })

    function processActivationVoter(msg){
      var message = JSON.parse(msg.content.toString());
      message.voters.map((voter, index)=> {
        console.log(voter.name)
        publish("", "receive-info-voter", new Buffer.from(`Success Adding ${voter.name}`))
      })
      ch.nack(message)
    }

    function processActivationCandidate(msg){
      var message = JSON.parse(msg.content.toString());
      message.map(data => {
        console.log(`Candidate was added to Blockchain ${data.name}`)
      })
      ch.ack(message, true)
    }

    function processMsgVote(msg) {
      vote.commit(msg, function(ok) {
        try {
          if (ok)
            vote.reveal(msg, function(ok){
              try {
                if (ok) {
                  ch.ack(msg);
                } else {
                  ch.reject(msg, true)
                }
              } catch (error) {
                closeOnErr(err)
              }
            })
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      });
    }

    function processRegisterVoter(msg){
      let temp = JSON.parse(msg.content.toString());
      temp.voters.map(function(voter, index){
        setTimeout(function(){
          Object.assign(voter, {index: index, role: 'voter', admin: {encpk: temp.encpk}})
          publish("", "create-account-voter", new Buffer(JSON.stringify(voter)));
        }, 30000*index)
      })
      ch.ack(msg);
    }

    function processCreateAccount(msg){
      create.account(msg, function(ok, res){
        try {
          if (ok) {
            ch.ack(msg, res);
            let string = JSON.parse(msg.content.toString());
            let newMsg = { voter: {_id: string._id, id_ktp: string.id_ktp, account_address: res.account, id_kegiatan: string.id_kegiatan}, admin_encpk: string.admin.encpk}
            publish("", "create-ballot", new Buffer(JSON.stringify(newMsg)));
          } else {
            ch.reject(msg, true);
          }
        } catch (err) {
          closeOnErr(err)
        }
      })
    }

    function processCreateBallot(msg){
      create.ballot(msg, function(ok, txHash){
        try {
          if (ok) {
            ch.ack(msg);
            console.log(txHash)
          } else {
            ch.reject(msg, true);
          }
        } catch (err) {
          closeOnErr(err)
        }
      })
    }

    function processAuthVoter(msg){
      insertBallot(msg, function(ok, txHash){
        try {
          if (ok && txhHash) {
            auth.voter(msg, function(ok, txHash){
              try{
                if(ok && txhHash) {
                  ch.ack(msg, txHash)
                } else {
                  ch.reject(msg, true)
                }
              } catch (err){
                closeOnErr(err)
              }
            })
          } else {
            ch.reject(msg, true);
          }
        } catch (error) {
          closeOnErr(err);
        }
      })
    }

    function processFinalizationVoter(msg){
      let temp = JSON.parse(msg.content.toString());
      temp.voters.map(function(voter, index){
        setTimeout(function(){
          Object.assign(voter, {id_kegiatan: id_kegiatan, admin: {encpk: temp.encpk}})
          publish("", "auth-voter", new Buffer(JSON.stringify(voter)));
        }, 30000*index)
      })
      ch.ack(msg);
    }

    function processMsgCandidate(msg) {
      var temp = JSON.parse(msg.content.toString())
      var {candidate, id_kegiatan, encpk} = temp  
      candidate.map(function(c, index){
        setTimeout(function(){
          Object.assign(c, {id_kegiatan: id_kegiatan, encpk: encpk});
          publish("", "reg-candidates", new Buffer(JSON.stringify(c)));  
        }, 30000*index)
      })
      ch.ack(msg);
    }

    function processRegCandidate(msg){
      lock.candidate(msg, function(ok, txHash){
        try {
          if (ok) {
            ch.ack(msg);
            console.log(txHash)
          }
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      })
    }

    function processMsgElection(msg) {
      register.election(msg, function(ok){
        try {
          if (ok)
            ch.ack(msg);
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      })
    }

  });
}

//Publisher Internal
var pubChannel = null;
var offlinePubQueue = [];
function startPublisher() {
  amqpConn.createConfirmChannel(function(err, ch) {
    if (closeOnErr(err)) return;
      ch.on("error", function(err) {
      console.error("[AMQP] channel error", err.message);
    });
    ch.on("close", function() {
      console.log("[AMQP] channel closed");
    });

    pubChannel = ch;
    while (true) {
      var m = offlinePubQueue.shift();
      if (!m) break;
      publish(m[0], m[1], m[2]);
    }
  });
}

function publish(exchange, routingKey, content) {
  try {
    pubChannel.publish(exchange, routingKey, content, { persistent: true },
                      function(err, ok) {
                        if (err) {
                          console.error("[AMQP] publish", err);
                          offlinePubQueue.push([exchange, routingKey, content]);
                          pubChannel.connection.close();
                        }
                      });
  } catch (e) {
    console.error("[AMQP] publish", e.message);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

start();
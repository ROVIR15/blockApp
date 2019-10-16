const amqp = require('amqplib/callback_api');
const amqurl = require('./config/index').AMQURL;
const mongoose = require('mongoose');
const MongoURL = require('./config/index').MONGOURL;

mongoose.connect(MongoURL, function(err, con){
    if(err) console.log("Cannot make connection");
    console.log("MongoDB Connected");
})

const {activate,
      create,     
      voter,
      store       
      } = require('./worker');

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

    ch.assertQueue("activate-voters", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("activate-voters", processVoters, {noAck: false});
      console.log("Voter worker is started");
    })

    ch.assertQueue("activate-candidates", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("activate-candidates", processCandidates, {noAck: false});
      console.log("Candidate process is started")
    })

    ch.assertQueue("activation-candidate", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("activation-candidate", activationCandidate, {noAck: false});
      console.log("Activation Candidate process is started")
    })

    ch.assertQueue("activation-voter", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("activation-voter", activationVoter, {noAck: false});
      console.log("Activation Voter process is started")
    })

    ch.assertQueue("voter-vote", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("voter-vote", voterVote, {noAck: false});
      console.log("Voter vote process is started")
    })

    ch.assertQueue("create-election", {durable: false}, function(err, _ok){
      if(closeOnErr(err)) return;
      ch.consume("create-election", createElection, {noAck: false});
      console.log("Create Election process is started")
    })

    function processVoters(msg){
      // console.log(msg)
      var message = JSON.parse(msg.content.toString());
      message.data.map((voter, index)=> {
        setTimeout(()=>{
          let obj = {voter, election_id: message.election_id, administrator_id: message.administrator_id}
          publish("", "activation-voter", new Buffer.from(JSON.stringify(obj)))
        }, 30000*index)
      })
      ch.ack(msg)
    }

    function processCandidates(msg){
      var message = JSON.parse(msg.content.toString());
      message.data.map((candidate, index)=> {
        setTimeout(()=>{
          let obj = {candidate, election_id: message.election_id, administrator_id: message.administrator_id, index: index}
          publish("", "activation-candidate", new Buffer.from(JSON.stringify(obj)))
        }, 30000*index)
      })
      ch.ack(msg)
    }

    function activationVoter(msg){
      activate.voter(msg, function(ok){
        try {
          if (ok)
            ch.ack(msg);
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      })
      // ch.ack(msg)
    }

    function activationCandidate(msg){
      // ch.ack(msg)
      activate.candidate(msg,function(ok, txHash){
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

    function createElection(msg) {
      // ch.ack(msg)
      create.election(msg, function(ok){
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

    function voterVote(msg){
      voter.vote(msg, function(ok){
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
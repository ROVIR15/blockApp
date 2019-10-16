const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Election = new Schema({
  election_name: {
    type: String,
    required: true
  },
  institution_name: {
    type: String,
    required: true
  },
  institution_address: {
    type: String
  },
  election_start: {
    type: String
  },
  election_end: {
    type: String
  },
  description: {
    type: String
  },
  voters: {
    type: Array,
    default: []
  },
  candidates: {
    type: Array,
    default: []
  },
  administrator: {
    type: Array,
    default: []
  },
  contractAddress: {
    type: String,
    default: "0x000000000000000000000000000000"
  },
  transaction_hash: {
    type: String,
    default: "0x000000000000000000000000000000"
  },
  timestamp: {
    type: Date,
    default: new Date()
  }
});

module.exports = Elections = mongoose.model('Election', Election);

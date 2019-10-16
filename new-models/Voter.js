const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Voter = new Schema({
    name: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    alamat: {
      type: String,
    },
    email: {
      type: String,
      required: true
    },
    identitification_id: {
      type: Number,
      required: true
    },
    authenticated: {
      type: Boolean,
      default: false
    },
    voted: {
      type: Boolean,
      default: false
    },
    contractAddress: {
      type: String,
      default: "0x000000000000000000000000"
    },
    election_id: {
      type: String
    }
});

module.exports = Voters = mongoose.model('voter', Voter);

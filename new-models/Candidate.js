const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Candidate = new Schema({
  seq_num: {
    type: Number,
    required: true
  },
  identification_id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  birth_place: {
    type: String,
    required: true
  },
  birth_date: {
    type: Date,
    default: Date.now
  },
  gender: {
    type: String,
    required: true
  },
  vision: {
    type: String
  },
  mission: {
    type: String
  },
  election_id: {
    type: String,
    required: true
  }
});

module.exports = Candidates = mongoose.model('Candidate', Candidate);
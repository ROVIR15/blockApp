const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const administrator = new Schema({
    election_id: {
      type: String,
    },
    name: {
      type: String,
      required: true
    },
    identification_id: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
});

module.exports = Administrators = mongoose.model('Administrator', administrator);
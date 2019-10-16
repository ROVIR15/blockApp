const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const institusiSchema = new Schema({
    nama_institusi: {
       type: String,
       required: true
    },
    alamat_institusi: {
      type: String,
    }
});

// usersSchema.methods.generateJWT = function() {
//   const today = new Date();
//   const expirationDate = new Date(today);
//   expirationDate.setDate(today.getDate() + 60);

//   return jwt.sign({
//     email: this.email,
//     id: this._id,
//     exp: parseInt(expirationDate.getTime() / 1000, 10),
//   }, 'secret');
// }

// usersSchema.methods.toAuthJSON = function() {
//   return {
//     _id: this._id,
//     username: this.username,
//     token: this.generateJWT(),
//   };
// };

module.exports = Institusi = mongoose.model('institusi', institusiSchema);

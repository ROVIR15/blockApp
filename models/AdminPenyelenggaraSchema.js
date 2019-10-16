const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const adminPemilihanSchema = new Schema({
    id_kegiatan: {
      type: String,
    },
    nama_adminpeny: {
      type: String,
      required: true
    },
    nik_adminpeny: {
      type: Number,
      required: true
    },
    jabatan_adminpeny: {
      type: String,
      required: true
    },
    email_adminpeny: {
      type: String,
      required: true
    }
});

// usersSchema.methods.isValidPassword = async function(password){
//   const validate = await bcrypt.compare(password, this.password)
//   return validate
// }

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

module.exports = AdminPenyelenggara = mongoose.model('admin_penyelenggara', adminPemilihanSchema);
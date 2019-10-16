const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pemilihSchema = new Schema({
    voteTxHash: {
      type: Object,
      default: {}
    },
    nama: {
      type: String,
      required: true
    },
    jenis_kelamin: {
       type: String,
    },
    alamat: {
        type: String,
    },
    email: {
      type: String,
      required: true
    },
    id_ktp: {
      type: Number,
      required: true
    },
    id_kegiatan: {
      type: String,
      required: true
    },
    code: {
      type: String
    },
    contract_address: {
      type: String
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

module.exports = Pemilih = mongoose.model('pemilih', pemilihSchema);

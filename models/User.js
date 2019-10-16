const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    encpk: {
        type: Object,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    id_kegiatan: {
        type: String,
        required: true 
    }
});

usersSchema.pre('save', async function(next){
  const user = this;
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
});

usersSchema.methods.setPassword = async function(password) {
  const user = this;//app.use('/logout', logout);

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash; 
};

usersSchema.methods.isValidPassword = async function(password){
  const validate = await bcrypt.compare(password, this.password)
  return validate
}

// usersSchema.methods.toAuthJSON = function() {
//   return {
//     _id: this._id,
//     username: this.username,
//     token: this.generateJWT(),
//   };
// };

module.exports = Users = mongoose.model('member', usersSchema);
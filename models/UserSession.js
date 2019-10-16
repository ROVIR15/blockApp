const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const Schema = mongoose.Schema;

const usersSession = new Schema({
    uid: {
        type: String,
        required: true
      },
    timestamp: {
        type: Date,
        default: Date.now
      },
    isAuth: {
        type: Boolean, 
        default: false
    },
    impkey: {
        type: String
    },
    privilige: [{
        isActivate: {
            type: Boolean,
            default: false
        },
        setting: {
            type: Boolean,
            default: false
        },
        create: {
            type: Boolean,
            default: false
        },
        isAdmin: {
            type: Boolean,
            default: false
        }
    }],
    tokens: [{
        type: String,
        required: true
    }]
});

usersSession.methods.generateAuthToken = function(){
  const user = this;
  //A. to prevent tokens array growing without a limit:
  const tokenLimit = 3;
  if(user.tokens.length >= tokenLimit){
      user.tokens.shift(); //if over the limit -> remove the oldest one.
  }
  //B. create new token:
  //  const access = user.privilige.toObject()[0];
  const token = jwt.sign({uid: user._id.toHexString(), name: user.uid, email: user.email}, "imnotgonnaleft").toString();
  //can clear the user.tokens array before adding, to limit the login-session, but we keep all the session in this project.
  user.tokens = user.tokens.concat([token]); //add the token into user's tokens array.
  //C. commit the changes above:
  return token;
};
 
usersSession.methods.removeAuthToken = function(token){
  const user = this;
  if(token){
      try{
          //remove only one token.
          const targetIndex = user.tokens.indexOf(token);
          if(targetIndex !== -1){
              user.tokens = user.tokens.filter( (elm, index) => index !== targetIndex );
              return user.save();
          }
      }catch(e){
          writeLog(e, {file: 'server/mongodb/schema/User.js:118'});
          return Promise.reject();
      }
  }else{
      try{
          //remove all the tokens.
          if(user.tokens.length > 0){
              user.tokens = [];
              return user.save();
          }
      }catch(e){
          writeLog(e, {file: 'server/mongodb/schema/User.js:129'});
          return Promise.reject();
      }
  }
};

usersSession.methods.authInfo = function(){
    return {
        id : this.uid,
        timestamp: this.timestamp,
        isAuth : this.tokens
    };
};


module.exports = userSession = mongoose.model('session_id', usersSession);
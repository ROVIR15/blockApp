
const RinkebyURL = require('./index').blockURL;
const Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider(RinkebyURL));

module.exports.web3 = web3;
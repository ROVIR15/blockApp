const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionStorage = new Schema({
  related_id: {
    type: String,
    required: true
  },
  transactions: {
    type: Array
  }
});

module.exports = DetailKegTransactionStorageiatan = mongoose.model('TransactionStorage', TransactionStorage);

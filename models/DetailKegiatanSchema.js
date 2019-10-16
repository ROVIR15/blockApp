const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const detailKegiatanSchema = new Schema({
    id_kandidat: [{
        type: String
    }],
    id_voter: [{
      type: String
    }],
    id_institusi: {
      type: String,
      required: true
    },
    id_admin_penyelenggara: {
      type: String,
      required: true
    },
    id_kegiatan: {
      type: String,
      required: true
    },
    allKandidatLocked: {
      type: Boolean,
      default: false
    },
    voterLocked: {
      type: Boolean,
      default: false
    },
    voterAuth: {
      type: Boolean,
      default: false
    },
    transaction : {
      type: Array,
      default: []
    }

});

module.exports = DetailKegiatan = mongoose.model('detail_kegiatan', detailKegiatanSchema);

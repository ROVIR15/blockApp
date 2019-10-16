const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kegiatanSchema = new Schema({
    id_address_kegiatan: {
      type:  String,
    },
    nama_kegiatan: {
       type: String,
       required: true
    },
    tanggal_mulai: {
      type: Date,
    },
    tanggal_selesai: {
      type: Date,
    },
    waktu_mulai: {
      type: Number
    },
    waktu_akhir: {
      type: Number
    },
    des_kegiatan: {
      type: String
    },
    date_reg: {
      type: Date,
      default: Date.now
    },
    electionActive: {
      type: Boolean,
      default: false
    },
    contract_address: {
      type: String,
      default: "0x0000000000000000000000000"
    },
    transaction_hash: {
      type: String,
      default: "0x0000000000000000000000000"
    }
});

module.exports = Kegiatan = mongoose.model('kegiatan', kegiatanSchema);

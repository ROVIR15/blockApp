const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kandidatSchema = new Schema({
  id_ktp:{
    type: Number,
    required: true
  },
  id_kegiatan:{
    type: String,
    required: true
  },
  nama_kandidat: {
    type: String,
    required: true
  },
  alamat_kandidat: {
    type: String,
    required: true
  },
  tanggal_lahir: {
    type: Date,
  },
  jenis_kelamin: {
    type: String,
    required: true
  },
  jabatan: {
    type: String
  },
  biografi: {
    type: String
  },
  visi_misi: {
    type: String
  },
  proker: {
    type: String
  },
  deskripsi_diri: {
    type: String,
  },
  no_urut: {
    type: Number,
    required: true
  },
  transaction_hash: {
    type: String,
    default: "0x000000000000000"
  }
});

module.exports = Kandidat = mongoose.model('kandidat', kandidatSchema);
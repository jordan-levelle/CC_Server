const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileId: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);

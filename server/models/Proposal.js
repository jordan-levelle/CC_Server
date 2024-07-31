const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const voteSchema = new Schema({
  name: String,
  opinion: String,
  comment: String
}, { timestamps: true });

const proposalSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  name: { type: String, required: false },
  email: { type: String, required: false },
  isExample: { type: Boolean, default: false },
  user_id: { type: String, required: true },
  uniqueUrl: { type: String, required: true, unique: true },
  firstRender: { type: Boolean, default: true },
  votes: [voteSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days
  }
}, { timestamps: true });

module.exports = mongoose.model('Proposal', proposalSchema);

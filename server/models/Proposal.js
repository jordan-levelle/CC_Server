const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voteSchema = new Schema({
  name: String,
  vote: String,
  comment: String
}, { timestamps: true });

const proposalSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  name: String,
  email: String,
  isExample: {
    type: Boolean,
    default: false
  },
  user_id: {
    type: String,
    required: true
  },
  uniqueUrl: {
    type: String,
    required: true,
    unique: true
  },
  votes: [voteSchema]
}, { timestamps: true });

module.exports = mongoose.model('Proposal', proposalSchema);


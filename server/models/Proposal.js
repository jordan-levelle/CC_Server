const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voteSchema = new Schema({
  name: String,
  vote: String, // 'yes' or 'no'
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
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  isExample: {
    type: Boolean,
    default: false
  },
  user_id: {
    type: String,
    required: true
  },
  uniqueUrl: {
    type: String, // Store the unique URL for the proposal
    required: true,
    unique: true // Ensure uniqueness of the URL
  },
  votes: [voteSchema], // Array of votes
  isFirstCreation: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Proposal', proposalSchema);

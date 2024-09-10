import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const voteSchema = new Schema({
  name: String,
  opinion: String,
  comment: String
}, { timestamps: true });

const proposalSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  name: { type: String },
  email: { type: String, match: /.+\@.+\..+/ }, 
  user_id: { type: String, required: true },
  uniqueUrl: { type: String, required: true, unique: true },
  firstRender: { type: Boolean, default: true },
  isExpired: { type: Boolean, default: false},
  isArchived: { type: Boolean, default: false},
  votes: [voteSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default model('Proposal', proposalSchema);


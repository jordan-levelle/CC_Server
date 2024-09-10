import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const memberSchema = new Schema({
  memberName: {
    type: String,
    required: true
  },
  memberEmail: {
    type: String,
    required: false
  }
});

const teamSchema = new Schema({
  teamName: { type: String, required: true },
  members: [memberSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true } // Reference to the user who created the team
});

export default model('Team', teamSchema);


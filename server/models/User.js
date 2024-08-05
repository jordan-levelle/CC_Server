const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  proposals: [{ type: Schema.Types.ObjectId, ref: 'Proposal' }],
  participatedProposals: [{
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    voteId: { type: Schema.Types.ObjectId } // Reference to the vote within the Proposal
  }],
  userTeams: [{
    teamId: { type: Schema.Types.ObjectId, ref: 'Teams' },
  }],
  verificationToken: String,
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  subscriptionStatus: { type: Boolean, default: false }
});

// Password hashing pre-save userSchema
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);


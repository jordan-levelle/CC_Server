const User = require('../models/User');
const Proposal = require('../models/Proposal');
const proposalController = require('../controllers/proposalController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto'); 
const { sendEmail } = require('../utils/EmailUtils');

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '1d' });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = createToken(user._id);

    res.status(200).json({
      email,
      token,
      subscriptionStatus: user.subscriptionStatus // Include subscriptionStatus
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const signupUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const newUser = new User({ email, password });
    const verificationToken = crypto.randomBytes(20).toString('hex'); // Generating a random token

    newUser.verificationToken = verificationToken;
    await newUser.save();

    const verificationAndRedirectLink = `${process.env.ORIGIN}verify/${verificationToken}`;
    const emailSubject = 'Account Verification';
    const emailContent = `
      <p>Click the link below to verify your account and be redirected to your account page:</p>
      <p><a href="${verificationAndRedirectLink}" target="_blank">Verify Your Account</a></p>
    `;
    await sendEmail(email, emailSubject, emailContent);

    const token = createToken(newUser._id); 
    res.status(201).json({ email, token, verificationToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyUser = async (req, res) => {
  const { token } = req.params;

  try {
    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.verified) {
      return res.status(200).json({ message: 'User already verified' });
    }

    // Mark the user as verified
    user.verified = true;
    await user.save();

    // Delay token removal for a brief period
    setTimeout(async () => {
      user.verificationToken = undefined;
      await user.save();
    }, 120000); // Delay for 1 minute 

    res.status(200).json({ message: 'Account verified successfully' });
  } catch (error) {
    console.error('Error verifying account:', error);
    res.status(500).json({ error: 'An error occurred while verifying the account' });
  }
};

const checkVerificationStatus = async (req, res) => {
  const { token } = req.params;

  try {
    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ verified: user.verified });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: 'An error occurred while checking verification status' });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.user._id;
  const deleteProposals = req.body.deleteProposals || false;

  try {
    if (deleteProposals) {
      await proposalController.deleteProposalsByUser(userId);
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserEmail = async (req, res) => {
  const userId = req.user._id;
  const { email } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { email });
    res.status(200).json({ message: 'Email updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetUserPassword = async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the old password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old password' });
    }

    // Update the password directly
    user.password = newPassword;

    // Save the updated user password
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(`Error resetting password for user ID ${userId}:`, error.message);
    res.status(500).json({ error: error.message });
  }
};

const resetForgotUserPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in resetUserPassword API:', error);
    res.status(500).json({ error: 'An error occurred while resetting your password.' });
  }
};

const forgotUserPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No user found with that email' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

    // Save the user with the new reset token
    await user.save();

    // Create the password reset link
    const resetLink = `${process.env.ORIGIN}reset/${resetToken}`;
    const emailSubject = 'Password Reset Request';
    const emailContent = `
      <p>You are receiving this because you (or someone else) have requested to reset the password for your account.</p>
      <p>Please click on the following link, or paste this into your browser to complete the process:</p>
      <p><a href="${resetLink}" target="_blank">Reset Your Password</a></p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    // Send the reset email
    await sendEmail(email, emailSubject, emailContent);

    // Respond to the client
    res.status(200).json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Error in forgotUserPassword API:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

const setParticipatedProposal = async (req, res) => {
  const { proposalId, voteId } = req.body;

  try {
    const user = await User.findById(req.user.id).populate('proposals'); // Populate user's proposals

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the proposal belongs to the user
    const isUserProposal = user.proposals.some(p => p._id.toString() === proposalId);

    // If the proposal belongs to the user, skip adding it to participatedProposals but still allow participation
    if (isUserProposal) {
      return res.status(200).json({ success: true, message: "Proposal participation allowed but not tracked in participated proposals" });
    }

    const existingParticipation = user.participatedProposals.find(p => p.proposalId.toString() === proposalId);

    if (existingParticipation) {
      // Check if voteId already exists
      if (existingParticipation.voteId === voteId) {
        // Remove the voteId when the same voteId is provided to delete
        existingParticipation.voteId = null;
      } else {
        // Update existing participation with new voteId
        existingParticipation.voteId = voteId;
      }
    } else {
      // Add new participation
      user.participatedProposals.push({ proposalId, voteId });
    }

    await user.save();

    return res.status(200).json({ success: true, message: 'Participated proposal updated successfully' });
  } catch (error) {
    console.error('Error updating participated proposals:', error.message);
    res.status(500).json({ success: false, message: 'Error updating participated proposals' });
  }
};


const getParticipatedProposals = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate({
      path: 'participatedProposals.proposalId',
      model: 'Proposal',
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Map the user's participated proposals, ensuring null values are skipped
    const participatedProposals = user.participatedProposals.map(participation => {
      const proposal = participation.proposalId;
      if (!proposal) {
        return null;  // Skip if proposal is null to avoid errors
      }
      const vote = proposal.votes ? proposal.votes.id(participation.voteId) : null;
      return { 
        proposalId: proposal._id, 
        proposalTitle: proposal.title,
        uniqueUrl: proposal.uniqueUrl,
        vote 
      };
    }).filter(participation => participation !== null); // Filter out null values

    res.status(200).json(participatedProposals);
  } catch (error) {
    console.error('Error fetching participated proposals:', error.message);
    res.status(500).json({ error: error.message });
  }
};


const removeParticipatedProposal = async (req, res) => {
  const { id } = req.params; // The proposal ID to be removed
  const user_id = req.user._id; // The authenticated user's ID

  try {
    const user = await User.findOneAndUpdate(
      { _id: user_id },
      { $pull: { participatedProposals: { proposalId: id } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Participated proposal not found' });
    }

    res.status(200).json({ message: 'Participated proposal removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const archiveProposal = async (req, res) => {
  const { id } = req.params; // The proposal ID
  const user_id = req.user._id; // The authenticated user's ID

  try {
    // Find the proposal
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Determine if the proposal is currently archived
    const isCurrentlyArchived = proposal.isArchived;

    // Toggle the proposal's archived state
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      { $set: { isArchived: !isCurrentlyArchived } }, // Toggle the isArchived state
      { new: true }
    );

    if (!updatedProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Update the user's archivedProposals list
    let userUpdate;
    if (isCurrentlyArchived) {
      // Remove from archivedProposals
      userUpdate = await User.findOneAndUpdate(
        { _id: user_id, archivedProposals: id },
        { $pull: { archivedProposals: id } },
        { new: true, runValidators: true }
      );
    } else {
      // Add to archivedProposals
      userUpdate = await User.findOneAndUpdate(
        { _id: user_id, archivedProposals: { $ne: id } },
        { $push: { archivedProposals: id } },
        { new: true, runValidators: true }
      );
    }

    if (!userUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'Proposal toggle state updated successfully', proposal: updatedProposal });
  } catch (error) {
    console.error('Error in archiveProposal function:', error.message);
    res.status(500).json({ error: error.message });
  }
};






const archiveParticipatedProposal = async (req, res) => {
  const { id } = req.params; // The proposal ID
  const user_id = req.user._id; // The authenticated user's ID


  try {
    // Find the proposal
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine if the proposal is currently archived
    const isCurrentlyArchived = user.archivedParticipatedProposals.includes(id);

    // Update the user's archivedParticipatedProposals list
    let userUpdate;
    if (isCurrentlyArchived) {
      // Remove from archivedParticipatedProposals
      userUpdate = await User.findOneAndUpdate(
        { _id: user_id, archivedParticipatedProposals: id },
        { $pull: { archivedParticipatedProposals: id } },
        { new: true, runValidators: true }
      );
    } else {
      // Add to archivedParticipatedProposals
      userUpdate = await User.findOneAndUpdate(
        { _id: user_id, archivedParticipatedProposals: { $ne: id } },
        { $push: { archivedParticipatedProposals: id } },
        { new: true, runValidators: true }
      );
    }

    if (!userUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'Participated proposal archived state updated successfully' });
  } catch (error) {
    console.error('Error in archiveParticipatedProposal function:', error.message);
    res.status(500).json({ error: error.message });
  }
};




const makeSubscriptionPayment = async (req, res) => {
  const { priceId } = req.body;

  // Find the user in the database
  let user = req.user; // User is already attached to the request by requireAuth middleware

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create a Stripe customer if not already exists
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  } else {

  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: 'price_1PdwW3DfXxf0bxwGjLCd8htC',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.ORIGIN}/subscribe?success=true`,
      cancel_url: `${process.env.ORIGIN}/subscribe?canceled=true`,
    });

    // Send back only the session URL for redirection
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ error: 'Failed to create Stripe session' });
  }
};

const cancelSubscription  = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No subscription found' });
    }

    const subscription = await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    if (subscription.status === 'canceled') {
      user.subscriptionStatus = false;
      user.stripeSubscriptionId = null;
      await user.save();

      return res.status(200).json({ message: 'Subscription cancelled successfully', subscriptionStatus: user.subscriptionStatus });
    } else {
      return res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { 
  signupUser, 
  loginUser, 
  verifyUser, 
  deleteUser, 
  updateUserEmail,
  makeSubscriptionPayment,
  cancelSubscription,
  resetUserPassword,
  forgotUserPassword,
  resetForgotUserPassword, 
  getParticipatedProposals,
  setParticipatedProposal,
  archiveProposal,
  archiveParticipatedProposal,
  removeParticipatedProposal,
  checkVerificationStatus,
};
const User = require('../models/User');
const Proposal = require('../models/Proposal');
const proposalController = require('../controllers/proposalController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/EmailUtils');


const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '1d' });
}

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

    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const crypto = require('crypto'); // Use for generating the token

const signupUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }


    const newUser = await User.create({ email, password });
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

    const token = createToken(newUser._id); // JWT for authentication
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

    

    // Optional: Delay token removal for a brief period
    setTimeout(async () => {
      user.verificationToken = undefined;
      await user.save();
    }, 120000); // Delay for 1 minute (adjust as needed)

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
    res.status(200).json({ message: 'Email updated successfully'});
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
}

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
  const { token, newPassword} = req.body;
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



const getParticipatedProposals = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate('participatedProposals');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user.participatedProposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { signupUser, 
                   loginUser, 
                   verifyUser, 
                   deleteUser, 
                   updateUserEmail,
                   resetUserPassword,
                   forgotUserPassword,
                   resetForgotUserPassword, 
                   getParticipatedProposals,
                   checkVerificationStatus };
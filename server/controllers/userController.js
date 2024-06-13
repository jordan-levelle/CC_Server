const User = require('../models/User');
const Proposal = require('../models/Proposal');
const proposalController = require('../controllers/proposalController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail, generateVerificationToken } = require('../utils/EmailUtils');


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
                   getParticipatedProposals,
                   checkVerificationStatus };
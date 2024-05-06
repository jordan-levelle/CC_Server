// userController.js

const User = require('../models/User');
const Proposal = require('../models/Proposal');
const proposalController = require('../controllers/proposalController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { sendEmail, generateVerificationToken } = require('../utils/EmailUtils');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '1D' });
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

const signupUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const newUser = await User.create({ email, password });

    // Generate a verification token using the utility function
    const verificationToken = generateVerificationToken(newUser._id);

    // Save the verification token to the user document
    newUser.verificationToken = verificationToken;
    await newUser.save();

    // Construct the verification and redirect link
    const verificationAndRedirectLink = `${process.env.BASE_URL}/verify/${verificationToken}`;

    // Send verification email using the utility function
    const emailSubject = 'Account Verification';
    const emailContent = `Click ${verificationAndRedirectLink} to verify your account and be redirected to your account page.`;
    await sendEmail(email, emailSubject, emailContent);

    const token = createToken(newUser._id);

    res.status(201).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


const verifyUser = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Account verified successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const deleteUser = async (req, res) => {
  const userId = req.user._id;
  const deleteProposals = req.body.deleteProposals || false;

  try {
    if (deleteProposals) {
      // Call the deleteProposalsByUser function from the proposal controller
      await proposalController.deleteProposalsByUser(userId);
    }

    // Delete user account
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
    res.status(200).json({ message: 'Email updated successfullt'});
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
}

module.exports = { signupUser, loginUser, verifyUser, deleteUser, updateUserEmail };



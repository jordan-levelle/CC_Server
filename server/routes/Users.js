const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  loginUser,
  signupUser,
  verifyUser,
  deleteUser,
  resetUserPassword,
  updateUserEmail,
  getParticipatedProposals,
  setParticipatedProposal,
  checkVerificationStatus,
  forgotUserPassword,
  resetForgotUserPassword
} = require('../controllers/userController');

const router = express.Router();

// Login route
router.post('/login', loginUser);

// Signup route
router.post('/signup', signupUser);

// Verification route
router.post('/verify/:token', verifyUser);

// Check verification status route
router.get('/verify/status/:token', checkVerificationStatus);

// Delete route
router.delete('/deleteUser', requireAuth, deleteUser);

// Update email route
router.put('/updateEmail', requireAuth, updateUserEmail);

// Reset Old Password
router.put('/resetPassword', requireAuth, resetUserPassword);

// Send Forgot Password Link
router.post('/forgotPassword', forgotUserPassword);

// Reset Forgot Password
router.post('/resetForgotPassword', resetForgotUserPassword);

// POST participated proposals route
router.post('/setParticipatedProposal', requireAuth, setParticipatedProposal);

// Get participated proposals route
router.get('/getParticipatedProposals', requireAuth, getParticipatedProposals);

module.exports = router;
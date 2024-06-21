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
  checkVerificationStatus,
  forgotUserPassword
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

// Reset Password
router.put('/resetPassword', requireAuth, resetUserPassword);

// Forgot Password
router.post('/forgotPassword', forgotUserPassword);

// Get participated proposals route
router.get('/participatedProposals', requireAuth, getParticipatedProposals);

module.exports = router;
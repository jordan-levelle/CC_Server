const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  loginUser,
  signupUser,
  verifyUser,
  deleteUser,
  updateUserEmail,
  getParticipatedProposals,
  checkVerificationStatus
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
router.delete('/delete', requireAuth, deleteUser);

// Update email route
router.put('/updateEmail', requireAuth, updateUserEmail);

// Get participated proposals route
router.get('/participatedProposals', requireAuth, getParticipatedProposals);

module.exports = router;
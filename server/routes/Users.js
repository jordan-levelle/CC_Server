const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  loginUser,
  signupUser,
  verifyUser,
  deleteUser,
  resetUserPassword,
  updateUserEmail,
  makeSubscriptionPayment,
  cancelSubscription,
  getParticipatedProposals,
  setParticipatedProposal,
  removeParticipatedProposal,
  archiveProposal,
  getArchivedProposals,
  checkVerificationStatus,
  forgotUserPassword,
  resetForgotUserPassword
} = require('../controllers/userController');

const router = express.Router();

// User management routes
router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/verify/:token', verifyUser);
router.get('/verify/status/:token', checkVerificationStatus);
router.delete('/deleteUser', requireAuth, deleteUser);
router.put('/updateEmail', requireAuth, updateUserEmail);
router.put('/resetPassword', requireAuth, resetUserPassword);
router.post('/forgotPassword', forgotUserPassword);
router.post('/resetForgotPassword', resetForgotUserPassword);

// Subscription routes
router.post('/makePayment', requireAuth, makeSubscriptionPayment);
router.post('/cancel-subscription', requireAuth, cancelSubscription);

// Participated proposals routes
router.post('/setParticipatedProposal', requireAuth, setParticipatedProposal);
router.get('/getParticipatedProposals', requireAuth, getParticipatedProposals);
router.delete('/removeParticipatedProposal/:id', requireAuth, removeParticipatedProposal);

// Filter Routes
router.post('/archiveProposal/:proposalId', requireAuth, archiveProposal);

module.exports = router;

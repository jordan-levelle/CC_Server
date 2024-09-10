const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const {
  createProposal,
  getActiveProposals,
  getExpiredProposals,
  getAllProposals,
  getProposal,
  checkFirstRender,
  deleteProposal,
  updateProposal,
  submitVote,
  updateVote,
  getSubmittedVotes,
  deleteVote,
  deleteProposalsByUser,
} = require('../controllers/proposalController');

// Routes related to proposals
router.get('/active', requireAuth, getActiveProposals);
router.get('/expired', requireAuth, getExpiredProposals);
router.get('/all', requireAuth, getAllProposals);
router.post('/', requireAuth, createProposal);
router.delete('/:id', requireAuth, deleteProposal);
router.delete('/user/:id', requireAuth, deleteProposalsByUser);
router.put('/:id/votes/:voteId', requireAuth, updateVote);
router.put('/:uniqueUrl', updateProposal);
router.get('/:uniqueUrl', getProposal);
router.get('/:id/firstRender', checkFirstRender);
router.get('/:id/votes', getSubmittedVotes);
router.post('/:id/vote', submitVote);
router.delete('/votes/:id', deleteVote);

module.exports = router;

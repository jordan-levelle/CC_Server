const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const {
  createProposal,
  getProposals,
  getProposal,
  deleteProposal,
  updateProposal,
  submitVote,
  updateVote,
  getSubmittedVotes,
  deleteVote,
  getExampleProposal,
  deleteProposalsByUser,
} = require('../controllers/proposalController');

// Get all proposals
router.get('/', requireAuth, getProposals);

// Create a new proposal
router.post('/', requireAuth, createProposal);

// Delete a proposal by ID
router.delete('/:id', requireAuth, deleteProposal);

// Delete all proposals by user
router.delete('/user/:id', requireAuth, deleteProposalsByUser);

// Update a proposal by unique URL
router.put('/:uniqueUrl', requireAuth, updateProposal);

// Get a proposal by unique URL
router.get('/:uniqueUrl', getProposal);

// Get all votes for a proposal
router.get('/:id/votes', requireAuth, getSubmittedVotes);

// Submit a vote for a proposal
router.post('/:id/vote', requireAuth, submitVote);

// Update a vote for a proposal
router.put('/:id/vote', requireAuth, updateVote);

// Delete a vote by ID
router.delete('/votes/:id', requireAuth, deleteVote);

// Get an example proposal
router.get('/example', getExampleProposal);

module.exports = router;
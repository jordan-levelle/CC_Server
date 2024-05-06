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
  deleteProposalsByUser
} = require('../controllers/proposalController');

router.get('/', requireAuth, getProposals);
router.post('/', requireAuth, createProposal);
router.delete('/:id', requireAuth, deleteProposal);
router.delete('/id', requireAuth, deleteProposalsByUser);
router.put('/:uniqueUrl', updateProposal);


router.get('/:uniqueUrl', getProposal);
router.get('/:id/votes', getSubmittedVotes);
router.post('/:id/vote', submitVote);
router.put('/:id/vote', updateVote);
router.delete('/votes/:id', deleteVote);

router.get('/example', getExampleProposal);


module.exports = router;
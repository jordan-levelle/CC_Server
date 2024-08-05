const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const checkSubscription = require('../middleware/requireSubscription');
const { 
    createTeam,
    editTeam,
    deleteTeam,
    teamList
 } = require('../controllers/teamController');

router.post('/teams', requireAuth, checkSubscription, createTeam);
router.post('/teams', requireAuth, checkSubscription, editTeam);
router.post('/teams', requireAuth, checkSubscription, deleteTeam);
router.post('/teams', requireAuth, checkSubscription, teamList);

module.exports = router;
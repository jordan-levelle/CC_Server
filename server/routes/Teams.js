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

router.post('/createUserTeam', requireAuth, checkSubscription, createTeam);
router.put('/editUserTeam/:teamId', requireAuth, checkSubscription, editTeam);
router.delete('/deleteUserTeam/:teamId', requireAuth, checkSubscription, deleteTeam);
router.get('/viewUserTeamList', requireAuth, checkSubscription, teamList);

module.exports = router;
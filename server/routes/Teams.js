import { Router } from 'express';
const router = Router();
import requireAuth from '../middleware/requireAuth';
import checkSubscription from '../middleware/requireSubscription';
import { createTeam, editTeam, deleteTeam, teamList } from '../controllers/teamController';

router.post('/createUserTeam', requireAuth, checkSubscription, createTeam);
router.put('/editUserTeam/:teamId', requireAuth, checkSubscription, editTeam);
router.delete('/deleteUserTeam/:teamId', requireAuth, checkSubscription, deleteTeam);
router.get('/viewUserTeamList', requireAuth, checkSubscription, teamList);

export default router;
import { cleanupExpiredParticipatedProposals } from '../controllers/userController';

const cron = require('node-cron');

cron.schedule('0 0 * * *', async() => {
    console.log('Running cleanup job...');
    await cleanupExpiredParticipatedProposals();
})
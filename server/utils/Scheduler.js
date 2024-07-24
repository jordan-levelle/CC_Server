const cron = require('node-cron');
const Proposal = require('../models/Proposal'); 

const TTL = 30 * 24 * 60 * 60 * 1000;

const propTTLScheduler = () => {
    cron.schedule('*/5 * * * *', async () => { // runs every 5 minutes
        const now = new Date();
        const expirationTime = new Date(now - TTL);
    
        try {
            const result = await Proposal.updateMany(
                { createdAt: { $lt: expirationTime }, expired: false },
                { $set: {expired: true}}
            );
            console.log(`TTL added and set for ${result.modifiedCount} proposals`);
        } catch (error) {
            console.error(error);
        }
    });
}

module.exports = propTTLScheduler;
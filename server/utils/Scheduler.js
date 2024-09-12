const cron = require('node-cron');
const Proposal = require('../models/Proposal');
const User = require('../models/User'); // Assuming you have a User model

const TTL = 30 * 24 * 60 * 60 * 1000;

const propCheckExpiredScheduler = () => {
    cron.schedule('0 0 * * *', async () => { 
        const now = new Date();
        const expirationTime = new Date(now - TTL);
    
        try {
            const proposalsToCheck = await Proposal.find({ createdAt: { $lt: expirationTime }, isExpired: false });

            for (const proposal of proposalsToCheck) {
                const user = await User.findById(proposal.user_id);

                if (user && !user.isSubscribed) {
                    proposal.isExpired = true;
                    await proposal.save();
                }
            }

            console.log('Expired proposals checked and updated where applicable');
        } catch (error) {
            console.error('Error checking and updating expired proposals:', error);
        }
    });
};

module.exports = propCheckExpiredScheduler;




// checks for proposals older than 30 days every day at midnight (0 0 * * *). 

// If user !subscribed to paid service. flag isExpired. 
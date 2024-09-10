import { schedule } from 'node-cron';
import { updateMany } from '../models/Proposal'; 

const TTL = 30 * 24 * 60 * 60 * 1000;

const propCheckExpiredScheduler = () => {
    schedule('0 0 * * *', async () => { 
        const now = new Date();
        const expirationTime = new Date(now - TTL);
    
        try {
            const result = await updateMany(
                { createdAt: { $lt: expirationTime }, isExpired: false },
                { $set: {expired: true}}
            );
            console.log(`TTL added and set for ${result.modifiedCount} proposals`);
        } catch (error) {
            console.error(error);
        }
    });
}

export default propCheckExpiredScheduler;



// checks for proposals older than 30 days every day at midnight (0 0 * * *). 
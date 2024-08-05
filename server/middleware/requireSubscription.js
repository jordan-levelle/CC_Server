const User = require('../models/User');

const checkSubscription = async (req, res, nexr) => {
    try {
        const user = await User.findById(req.user_.id);
        if(!user.subscriptionStatus) {
            return res.status(403).json({ message: 'Subscription required to create a team'});
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error})
    }
};

module.exports = checkSubscription;
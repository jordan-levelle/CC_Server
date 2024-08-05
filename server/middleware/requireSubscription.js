const checkSubscription = (req, res, next) => {
    try {
        // Ensure req.user is available
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check subscription status directly from req.user
        if (!req.user.subscriptionStatus) {
            return res.status(403).json({ message: 'Subscription required to create a team' });
        }

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};

module.exports = checkSubscription;

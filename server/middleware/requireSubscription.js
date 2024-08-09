const checkSubscription = (req, res, next) => {
    try {
  
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      if (!req.user.subscriptionStatus) {
        return res.status(403).json({ message: 'Subscription required to create a team' });
      }
  
      next();
    } catch (error) {
      console.error('Internal server error:', error);
      res.status(500).json({ message: 'Internal Server Error', error });
    }
  };
  
  module.exports = checkSubscription;
  
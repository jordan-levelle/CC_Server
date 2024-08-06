const checkSubscription = (req, res, next) => {
    try {
      console.log('User in checkSubscription:', req.user);
  
      if (!req.user) {
        console.log('User object missing in request');
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      if (!req.user.subscriptionStatus) {
        console.log('User does not have an active subscription');
        return res.status(403).json({ message: 'Subscription required to create a team' });
      }
  
      console.log('User has an active subscription');
      next();
    } catch (error) {
      console.error('Internal server error:', error);
      res.status(500).json({ message: 'Internal Server Error', error });
    }
  };
  
  module.exports = checkSubscription;
  
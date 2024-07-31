const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    let user = null;

    if (authorization) {
      const token = authorization.split(' ')[1];

      if (token && token !== process.env.DUMMY_TOKEN) {
        const decodedToken = jwt.verify(token, process.env.SECRET);

        // Check if the token has expired
        if (decodedToken.exp * 1000 < Date.now()) {
          throw new Error('Token expired');
        }

        const { _id } = decodedToken;
        user = await User.findById(_id);

        if (!user) {
          throw new Error('User not found');
        }
      } else if (token === process.env.DUMMY_TOKEN) {
        user = { _id: process.env.DUMMY_USER }; // Dummy user for non-authenticated cases
      }
    }

    req.user = user; // Set user object in request
    next();
  } catch (error) {
    console.error('Authorization error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'JWT malformed or invalid' });
    } else if (error.message === 'Token expired' || error.message === 'User not found') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireAuth;
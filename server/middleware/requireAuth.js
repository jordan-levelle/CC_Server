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

    req.user = user; // Set user object in request, null if not authenticated
    next();
  } catch (error) {
    console.error('Authorization error:', error.message);
    next(); // Proceed even if unauthorized, but req.user will be null
  }
};

module.exports = requireAuth;





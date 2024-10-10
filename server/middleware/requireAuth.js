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

    // If no token, generate a new dummy token for the request
    if (!user) {
      const newDummyToken = jwt.sign({ _id: process.env.DUMMY_USER }, process.env.SECRET, { expiresIn: '1h' });
      req.user = { _id: process.env.DUMMY_USER };
      req.headers.authorization = `Bearer ${newDummyToken}`; // Set the new dummy token in headers
    } else {
      req.user = user; // Set the authenticated user object
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error.message);
    next(); // Proceed even if unauthorized
  }
};

module.exports = requireAuth;



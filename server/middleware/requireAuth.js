const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];

    try {
        let user;

        // If it's a dummy token, set a dummy user object
        if (token === 'dummyToken') {
            user = { _id: 'dummyUserId' };
        } else {
            const decodedToken = jwt.verify(token, process.env.SECRET);
            
            // Check if the token has expired
            if (decodedToken.exp * 1000 < Date.now()) {
                return res.status(401).json({ error: 'Token expired' });
            }

            // Find the user in the database using the decoded user ID
            const { _id } = decodedToken;
            user = await User.findById(_id);
            
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
        }

        req.user = user; // Set the user object in the request
        next(); // Call the next middleware
    } catch (error) {
        console.error('Authorization error:', error.message); // Log error message
        res.status(401).json({ error: 'Request is not authorized' });
    }
};

module.exports = requireAuth;
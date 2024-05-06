const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];

    try {
        let decodedUser;

        // If it's a dummy token, set dummy user
        if (token === 'dummyToken') {
            decodedUser = { _id: 'dummyUserId' }; // Set a dummy user object
        } else {
            decodedUser = jwt.verify(token, process.env.SECRET);
        }

        // If the user is not a dummy user, find the user in the database
        const { _id } = decodedUser;
        let user;

        if (_id !== 'dummyUserId') {
            user = await User.findOne({ _id });
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
        }

        req.user = user || decodedUser; // Set user to the found user or the decoded user
        next();
    } catch (error) {
        console.error('Authorization error:', error.message); // Log error message
        res.status(401).json({ error: 'Request is not authorized' });
    }
};

module.exports = requireAuth;
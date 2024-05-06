const express = require('express');
const requireAuth = require('../middleware/requireAuth');

// controller functions
const { loginUser, signupUser, verifyUser, deleteUser, updateUserEmail } = require('../controllers/userController')

const router = express.Router()

// login route
router.post('/login', loginUser)

// signup route
router.post('/signup', signupUser)

// Verification route
router.post('/verify/:token', verifyUser); 


// delete route
router.delete('/delete', requireAuth, deleteUser)

router.put('/updateEmail', requireAuth, updateUserEmail)

module.exports = router
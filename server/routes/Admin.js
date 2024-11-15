const express = require('express');
const router = express.Router();
// const requireAuth = require('../middleware/requireAuth');

const {
    getAllProposalsAdmin,
    getAllUsersAdmin
} = require ('../controllers/adminController');

router.get('/allProposals', getAllProposalsAdmin);
router.get('/allUsers', getAllUsersAdmin);

module.exports = router;
const express = require('express');
const router = express.Router();
const { documentUpload } = require('../controllers/documentController');

router.post('/:id', documentUpload); // Note: Updated from './:id/upload' to '/:id/upload'

module.exports = router;

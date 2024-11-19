const express = require('express');
const multer = require('multer');
const { uploadDocument } = require('../controllers/documentController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Document upload route
router.post('/upload/:proposalId', requireAuth, upload.single('file'), uploadDocument);

module.exports = router;

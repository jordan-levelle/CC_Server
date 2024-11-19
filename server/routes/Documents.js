const express = require('express');
const multer = require('multer');
const { uploadDocument } = require('../controllers/documentController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Document upload route
router.post('/upload/:proposalId', upload.single('file'), uploadDocument);

module.exports = router;

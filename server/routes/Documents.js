const express = require('express');
const router = express.Router();
const multer = require('multer');

// Set up multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Import your controller
const documentUpload = require('../controllers/documentController');

// Route to upload document
router.post('/:id', upload.single('file'), (req, res) => {
  const gfs = req.app.get('gfs');

  // Check if GridFS is initialized
  if (!gfs) {
    console.error('GridFSBucket is not initialized');
    return res.status(500).send('GridFSBucket not initialized');
  }

  // Check if file is provided
  if (!req.file) {
    console.error('No file provided');
    return res.status(400).send('No file provided');
  }

  console.log('Request received:', req.params.id, req.file); // Log to check file and ID
  documentUpload(req, res, gfs);
});

module.exports = router;

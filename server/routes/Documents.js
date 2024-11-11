const express = require('express');
const router = express.Router();
const multer = require('multer');

// Set up multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Import your controller
const { documentUpload } = require('../controllers/documentController');

// Route to upload document
router.post('/:id', upload.single('file'), (req, res) => {
  const gfs = req.app.get('gfs');

  if (!gfs) {
    return res.status(500).send('GridFSBucket not initialized');
  }

  if (!req.file) {
    return res.status(400).send('No file provided');
  }

  documentUpload(req, res, gfs);
});

module.exports = router;

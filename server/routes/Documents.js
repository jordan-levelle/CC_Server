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
  console.log('Request received:', req.params.id, req.file); // Log to check file and ID
  const gfs = req.app.get('gfs');
  documentUpload(req, res, gfs);
});

module.exports = router;



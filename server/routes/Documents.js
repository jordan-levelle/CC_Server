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
  // Access gfs through req.app
  const gfs = req.app.get('gfs'); // Get gfs from the app instance
  documentUpload(req, res, gfs); // Pass gfs to the documentUpload function
});

module.exports = router;



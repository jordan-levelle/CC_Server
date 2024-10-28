const express = require('express');
const router = express.Router();
const multer = require('multer');

// Set up multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Import your controller
const { documentUpload } = require('../controllers/documentController');

// Set up the route, passing gfs to the documentUpload function
router.post('/:id', upload.single('file'), (req, res) => {
  // Here you should pass `gfs` along with the request and response
  documentUpload(req, res, req.app.get('gfs')); // Assuming you've set gfs on app
});

module.exports = router;


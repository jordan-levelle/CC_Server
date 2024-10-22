const express = require('express');
const router = express.Router();
const { documentUpload } = require('../controllers/documentController');

router.post('/:id', documentUpload); 

module.exports = router;

const express = require('express');
const fileUpload = require('express-fileupload'); 
const router = express.Router();
const { documentUpload } = require('../controllers/documentController');

router.post('/:id', fileUpload(), documentUpload); 

module.exports = router;

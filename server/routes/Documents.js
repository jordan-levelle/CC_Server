const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const { uploadDocument,
        downloadDocument,
        removeDocument,
        replaceDocument

 } = require('../controllers/documentController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload/:proposalId', requireAuth, upload.single('file'), uploadDocument);
router.get('/:documentId', downloadDocument);
router.delete('/', removeDocument);
router.patch('/', replaceDocument);

module.exports = router;

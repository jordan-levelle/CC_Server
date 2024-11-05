
const documentUpload = async (req, res) => {
  console.log('Received upload request for proposal ID:', req.params.id);
  const gfs = req.app.get('gfs'); 

  if (!gfs) {
    console.error('GridFSBucket not available in documentUpload');
    return res.status(503).json({ error: 'File storage system not available' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadStream = gfs.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype,
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', async (file) => {
    try {
      const documentData = {
        fileName: req.file.originalname,
        filePath: file._id,
        mimeType: req.file.mimetype,
        proposalId: req.params.id,
      };

      const document = await Document.create(documentData);
      await Proposal.findByIdAndUpdate(
        req.params.id,
        { $push: { documents: document._id } },
        { new: true }
      );

      res.status(200).json({ message: 'File uploaded successfully', document });
    } catch (error) {
      console.error('File upload failed:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  uploadStream.on('error', (error) => {
    console.error('Error uploading to GridFS:', error);
    res.status(500).json({ error: 'Error uploading to GridFS' });
  });
};


module.exports = {
  documentUpload
};


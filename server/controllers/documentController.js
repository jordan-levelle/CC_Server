const documentUpload = async (req, res) => {
  console.log('Received upload request for proposal ID:', req.params.id);
  const gfs = req.app.get('gfs'); 

  if (!gfs) {
    console.error('GridFSBucket not available in documentUpload');
    return res.status(503).json({ error: 'File storage system not available' });
  }

  if (!req.file) {
    console.error('No file provided');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    // Handle the stream completion
    uploadStream.on('finish', async (file) => {
      try {
        const documentData = {
          fileName: req.file.originalname,
          filePath: file._id,
          mimeType: req.file.mimetype,
          proposalId: req.params.id,
        };

        // Save document and update proposal
        const document = await Document.create(documentData);
        await Proposal.findByIdAndUpdate(
          req.params.id,
          { $push: { documents: document._id } },
          { new: true }
        );

        res.status(200).json({ message: 'File uploaded successfully', document });
      } catch (error) {
        console.error(`Database operation failed for proposal ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to save document to database' });
      }
    });

    // Handle upload stream errors
    uploadStream.on('error', (error) => {
      console.error('Error uploading to GridFS:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error uploading to GridFS' });
      }
    });
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    res.status(500).json({ error: 'Unexpected error during file upload' });
  }
};

module.exports = { documentUpload };



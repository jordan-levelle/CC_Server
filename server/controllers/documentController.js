const documentUpload = async (req, res) => {
  const gfs = req.app.get('gfs');

  if (!gfs || !req.file) {
    return res.status(503).json({ error: 'File storage system or file not available' });
  }

  try {
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async (file) => {
      try {
        const documentData = {
          fileName: req.file.originalname,
          gridFSFileId: file._id, // Store GridFS file ID
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
        res.status(500).json({ error: 'Failed to save document to database' });
      }
    });

    uploadStream.on('error', (error) => {
      if (!res.headersSent) res.status(500).json({ error: 'Error uploading to GridFS' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error during file upload' });
  }
};

module.exports = { documentUpload };

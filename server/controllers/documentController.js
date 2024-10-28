const Document = require('../models/Document');
const Proposal = require('../models/Proposal');

const documentUpload = async (req, res, gfs) => {
  console.log('Received upload request for proposal ID:', req.params.id);

  const { id: proposalId } = req.params;

  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Create a readable stream and upload the file to GridFS
  const uploadStream = gfs.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype
  });

  uploadStream.end(req.file.buffer); // This uploads the file buffer to GridFS

  uploadStream.on('finish', async (file) => {
    try {
      const documentData = {
        fileName: req.file.originalname,
        filePath: file._id, // Store the file's ObjectId
        mimeType: req.file.mimetype,
        proposalId,
      };

      const document = await Document.create(documentData);
      console.log('Document created successfully:', document);

      // Add reference to the document in the associated proposal
      await Proposal.findByIdAndUpdate(
        proposalId,
        { $push: { documents: document._id } },
        { new: true }
      );

      res.status(200).json({ message: 'File uploaded successfully', document });
    } catch (error) {
      console.error('File upload failed: ', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  uploadStream.on('error', (error) => {
    console.error('Error uploading to GridFS:', error);
    res.status(500).json({ error: 'Error uploading to GridFS' });
  });
};

module.exports = {
  documentUpload,
};

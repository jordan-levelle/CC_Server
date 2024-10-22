// controllers/documentController.js
const Document = require('../models/Document');
const Proposal = require('../models/Proposal');

const documentUpload = async (req, res) => {
  const { id: proposalId } = req.params; // Get the proposal ID from the route parameters

  // Check if a file was uploaded
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadedFile = req.files.file;

  // Convert the file to Base64
  const fileData = uploadedFile.data.toString('base64');

  // Create a new document entry in the database
  const documentData = {
    fileName: uploadedFile.name,
    fileData, // Store the Base64 data
    mimeType: uploadedFile.mimetype,
    proposalId,
  };

  try {
    const document = await Document.create(documentData);

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
};

module.exports = {
  documentUpload,
};

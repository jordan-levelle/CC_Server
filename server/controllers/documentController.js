const Document = require('../models/Document');
const Proposal = require('../models/Proposal');

const documentUpload = async (req, res) => {
  const { id: proposalId } = req.params; // Get the proposal ID from the route parameters

  // Check if a file was uploaded
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadedFile = req.files.file;

  // Construct the file path where the file will be stored
  const filePath = `./uploads/${uploadedFile.name}`; // Adjust the path as needed

  try {
    // Move the file to the uploads directory
    await uploadedFile.mv(filePath);

    // Create a new document entry in the database
    const documentData = {
      fileName: uploadedFile.name,
      filePath,
      mimeType: uploadedFile.mimetype,
      proposalId
    };

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
  documentUpload
};

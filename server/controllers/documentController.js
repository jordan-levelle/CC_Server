const fs = require('fs');
const { b2 } = require('../utils/Backblaze');
const Proposal = require('../models/Proposal');
const Document = require('../models/Document');

// Upload document and associate it with a proposal
const uploadDocument = async (req, res) => {
  const { proposalId } = req.params;
  const file = req.file;

  try {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Step 1: Upload file to Backblaze
    const bucketId = process.env.BUCKET_ID;
    const uploadUrl = await b2.getUploadUrl({ bucketId });
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: file.originalname,
      data: fs.createReadStream(file.path),
    });

    const fileUrl = `https://f002.backblazeb2.com/file/${bucketId}/${file.originalname}`;

    // Step 2: Save file details to MongoDB
    const newDocument = await Document.create({
      fileName: file.originalname,
      fileUrl,
      fileId: uploadResponse.data.fileId,
      uploadedBy: req.user ? req.user._id : null, // Assuming user authentication
      proposal: proposalId,
    });

    // Step 3: Associate document with proposal
    proposal.documents.push(newDocument._id);
    await proposal.save();

    // Step 4: Cleanup local upload
    fs.unlinkSync(file.path);

    res.status(200).json({ message: 'File uploaded successfully', document: newDocument });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading document', error });
  }
};

module.exports = {
  uploadDocument,
};

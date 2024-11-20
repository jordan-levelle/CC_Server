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

    // Step 1: Read file into a Buffer
    const fileBuffer = fs.readFileSync(file.path);
    const fileStats = fs.statSync(file.path); 
    const fileSize = fileStats.size;

    // Step 2: Upload file to Backblaze
    const bucketId = process.env.BUCKET_ID;
    const bucketUrl = process.env.BUCKET_URL;
    const { data: uploadUrl } = await b2.getUploadUrl({ bucketId });

    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrl.uploadUrl,
      uploadAuthToken: uploadUrl.authorizationToken,
      fileName: file.originalname,
      data: fileBuffer, 
      contentLength: fileSize,
    });

    const fileUrl = `${bucketUrl}/file/${bucketId}/${file.originalname}`;

    // Step 3: Save file details to MongoDB
    const newDocument = await Document.create({
      fileName: file.originalname,
      fileUrl,
      fileId: uploadResponse.data.fileId,
      uploadedBy: req.user ? req.user._id : null, // Assuming user authentication
      proposal: proposalId,
    });

    // Step 4: Associate document with proposal
    proposal.documents.push(newDocument._id);
    await proposal.save();

    // Step 5: Cleanup local upload
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

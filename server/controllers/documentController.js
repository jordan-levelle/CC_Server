const fs = require('fs');
const mongoose = require('mongoose');
const { b2 } = require('../utils/Backblaze');
const Proposal = require('../models/Proposal');
const Document = require('../models/Document');

const bucketId = process.env.BUCKET_ID;
const bucketUrl = process.env.BUCKET_URL;

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

const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Construct the public URL for the document
    const downloadUrl = `${process.env.BUCKET_URL}/consensus-check/${encodeURIComponent(document.fileName)}`;

    res.status(200).json({ fileUrl: downloadUrl });
  } catch (error) {
    console.error('Error fetching document URL:', error);
    res.status(500).json({ message: 'Error fetching document URL', error });
  }
};


const removeDocument = async (req, res) => {
  const { documentId } = req.params; // Extract document ID from route parameters

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    // Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Remove the document from the associated proposal
    await Proposal.findByIdAndUpdate(document.proposal, {
      $pull: { documents: document._id },
    });

    // Remove the document from the database
    await Document.findByIdAndDelete(documentId);

    res.status(200).json({ message: 'Document successfully removed' });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ error: 'Failed to remove document' });
  }
};


module.exports = {
  uploadDocument,
  downloadDocument,
  removeDocument,
};

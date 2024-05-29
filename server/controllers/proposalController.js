const Proposal = require('../models/Proposal');
const mongoose = require('mongoose');
const { htmlToText } = require('html-to-text');
const { sendEmail } = require('../utils/EmailUtils');

// GET all proposals
const getProposals = async (req, res) => {
  const user_id = req.user._id;
  const proposals = await Proposal.find({ user_id }).sort({ createdAt: -1 });
  res.status(200).json(proposals);
};

// GET single proposal
const getProposal = async (req, res) => {
  const { uniqueUrl } = req.params;

  try {
    let proposal = await Proposal.findOne({ uniqueUrl });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.status(200).json(proposal);
  } catch (error) {
    console.error('Error fetching proposal by unique URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller for getting the example proposal
const getExampleProposal = async (req, res) => {
  try {
    const exampleProposal = await Proposal.findOne({ isExample: true });

    if (!exampleProposal) {
      return res.status(404).json({ error: 'Example proposal not found' });
    }

    // Return the example proposal data
    res.json(exampleProposal);
  } catch (error) {
    console.error('Error finding example proposal:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST create a proposal
const createProposal = async (req, res) => {
  const { title, description, name, email, uniqueUrl } = req.body;

  try {
    const user_id = req.user ? req.user._id : null;

    // Check email and name values
    const emailValue = email || null;
    const nameValue = name || null;
    const proposalData = { 
      title, 
      description, 
      name: nameValue, 
      email: emailValue, 
      user_id, 
      uniqueUrl,
    };

    // Create the proposal
    const proposal = await Proposal.create(proposalData);

    // Send email notification if email is provided
    if (emailValue) {
      const plainText = htmlToText(description, { wordwrap: 130 });
      const emailSubject = 'New Proposal Submitted';
      const emailContent = `
        <p>You submitted a new proposal!</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong> ${plainText}</p>
        <p><strong>Submitted by:</strong> ${name || 'Anonymous'}</p>
        <p><a href="${process.env.ORIGIN}${uniqueUrl}">Link to Proposal</a></p>
        <p><a href="${process.env.ORIGIN}edit/${uniqueUrl}">Link to Edit Proposal</a></p>
      `;
      
      await sendEmail(emailValue, emailSubject, emailContent);
    }

    res.status(200).json(proposal);
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(400).json({ error: error.message });
  }
};




// DELETE proposal
const deleteProposal = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such proposal' });
  }

  const proposal = await Proposal.findOneAndDelete({ _id: id });

  if (!proposal) {
    return res.status(400).json({ error: 'No such proposal' });
  }

  res.status(200).json(proposal);
};

const deleteProposalsByUser = async (userId) => {
  try {
    // Find and delete all proposals where user_id matches the provided userId
    const deleteResult = await Proposal.deleteMany({ user_id: userId });

    // Return the result of the deletion operation
    return deleteResult;
  } catch (error) {
    // Handle any errors
    console.error('Error deleting proposals:', error);
    throw new Error('Error deleting proposals');
  }
};

// UPDATE proposal
const updateProposal = async (req, res) => {
  const { uniqueUrl } = req.params;
  const { title, description, name, email, receiveNotifications } = req.body;

  try {
    // Find the proposal by its unique URL
    const proposal = await Proposal.findOne({ uniqueUrl });

    // If the proposal doesn't exist, return a 404 Not Found response
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Update the proposal fields with the new data
    proposal.title = title;
    proposal.description = description;
    proposal.name = name;
    proposal.email = email;
    proposal.receiveNotifications = receiveNotifications;

    // Save the updated proposal
    await proposal.save();

    // Return the updated proposal as the response
    res.json(proposal);
  } catch (error) {
    // If there's an error, return a 500 Internal Server Error response
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ADD vote to proposal
const submitVote = async (req, res) => {
  const { id } = req.params;
  const { name, vote, comment } = req.body;

  try {
    // Find the proposal by ID
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Add the vote to the proposal
    proposal.votes.push({ name, vote, comment });

    // Save the updated proposal
    await proposal.save();

    // Check if email notifications are enabled for the proposal owner
    if (proposal.email) {
      const emailSubject = 'New Vote Submitted';
      const emailContent = `
        <p>A new vote has been submitted for your proposal titled "<strong>${proposal.title}</strong>".</p>
        <p><strong>Submitted by:</strong> ${name}</p>
        <p><strong>Vote:</strong> ${vote}</p>
        <p><strong>Comment:</strong> ${comment}</p>
        <p><a href="${process.env.ORIGIN}${proposal.uniqueUrl}">View Proposal</a></p>
      `;

      await sendEmail(proposal.email, emailSubject, emailContent);
    }

    res.status(200).json({ message: 'Vote submitted successfully', proposal });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// PUT update proposal response
const updateVote = async (req, res) => {
  const { id } = req.params;
  const { name, vote, comment, newName } = req.body;

  try {
    // Find the proposal by ID
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Find the vote by ID or by name if name is provided
    const voteToUpdate = proposal.votes.id(req.body.voteId) || proposal.votes.find(v => v.name === name);
    if (!voteToUpdate) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    // Update the vote/comment/name
    if (vote !== undefined) voteToUpdate.vote = vote;
    if (comment !== undefined) voteToUpdate.comment = comment;
    if (newName !== undefined) voteToUpdate.name = newName;

    // Save the updated proposal
    await proposal.save();

    return res.status(200).json({ message: 'Vote/comment updated successfully' });
  } catch (error) {
    console.error('Error updating vote/comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// DELETE user vote
const deleteVote = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the proposal containing the vote to be deleted
    const proposal = await Proposal.findOne({ 'votes._id': id });
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal containing the vote not found' });
    }

    // Find the index of the vote to be deleted
    const voteIndex = proposal.votes.findIndex(vote => vote._id.toString() === id);
    if (voteIndex === -1) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    // Remove the vote from the proposal
    proposal.votes.splice(voteIndex, 1);

    // Save the updated proposal
    await proposal.save();

    // Return success message
    res.status(200).json({ message: 'Vote deleted successfully' });
  } catch (error) {
    console.error('Error deleting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET Votes for Proposal
const getSubmittedVotes = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the proposal by ID
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Return the submitted votes
    res.status(200).json({ votes: proposal.votes });
  } catch (error) {
    console.error('Error fetching submitted votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProposal,
  getProposals,
  getProposal,
  deleteProposal,
  updateProposal,
  submitVote,
  updateVote,
  getSubmittedVotes,
  deleteVote,
  getExampleProposal,
  deleteProposalsByUser,
};




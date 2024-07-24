const Proposal = require('../models/Proposal');
const User = require('../models/User');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import uuid package

const { sendEmail } = require('../utils/EmailUtils');

const getAllProposals = async (req, res) => {
  const user_id = req.user._id;
  const proposals = await Proposal.find({ user_id }).sort({ createdAt: -1 });
  res.status(200).json(proposals);
};

const getActiveProposals = async (req,res) => {
  const user_id = req.user._id;
  const activeProposals = await Proposal.find({ user_id, expired: false}).sort({ created: -1});
  res.status(200).json(activeProposals);
};

const getExpiredProposals = async (req,res) => {
  const user_id = req.user._id;
  const expiredProposals = await Proposal.find({ user_id, expired: true}).sort({ created: -1});
  res.status(200).json(expiredProposals);
};

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

const checkFirstRender = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const firstRender = proposal.firstRender;
    if (firstRender) {
      proposal.firstRender = false;
      await proposal.save();
    }

    return res.json({ firstRender });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};


const getExampleProposal = async (req, res) => {
  try {
    const exampleProposal = await Proposal.findOne({ isExample: true });

    if (!exampleProposal) {
      return res.status(404).json({ error: 'Example proposal not found' });
    }

    res.json(exampleProposal);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createProposal = async (req, res) => {
  const { title, description, name, email, uniqueUrl } = req.body;

  try {
    // Use DUMMY_USER if req.user is not available
    const userId = req.user ? req.user._id : process.env.DUMMY_USER;

    const emailValue = email || null;
    const nameValue = name || '';
    const proposalData = {
      title,
      description,
      name: nameValue,
      email: emailValue,
      user_id: userId,
      uniqueUrl
    };

    const proposal = await Proposal.create(proposalData);

    if (userId !== process.env.DUMMY_USER) {
      await User.findByIdAndUpdate(
        userId,
        { $push: { proposals: proposal._id } },
        { new: true }
      );
    }

    if (emailValue) {
      const uniqueId = uuidv4(); // Generate a UUID
      const emailSubject = 'New Proposal Submitted';
      const emailContent = `
        <p>You submitted a new proposal!</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Submitted by:</strong> ${nameValue}</p>
        <p><a href="${process.env.ORIGIN}${uniqueUrl}">Link to Proposal</a></p>
        <p><a href="${process.env.ORIGIN}edit/${uniqueId}/${uniqueUrl}">Link to Edit Proposal</a></p>
      `;

      await sendEmail(emailValue, emailSubject, emailContent);
    }

    res.status(200).json(proposal);
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(400).json({ error: error.message });
  }
};


const deleteProposal = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such proposal' });
  }

  const proposal = await Proposal.findOneAndDelete({ _id: id });

  if (!proposal) {
    return res.status(400).json({ error: 'No such proposal' });
  }

  // Remove the proposal ID from users' proposals
  await User.updateMany(
    { proposals: id },
    { $pull: { proposals: id } }
  );

  // Remove the proposal ID from users' participatedProposals
  await User.updateMany(
    { 'participatedProposals.proposalId': id },
    { $pull: { participatedProposals: { proposalId: id } } }
  );

  res.status(200).json(proposal);
};


const deleteProposalsByUser = async (userId) => {
  try {
    const proposals = await Proposal.find({ user_id: userId });
    const proposalIds = proposals.map(proposal => proposal._id);

    const deleteResult = await Proposal.deleteMany({ user_id: userId });

    // Remove the proposal IDs from users' proposals
    await User.updateMany(
      { proposals: { $in: proposalIds } },
      { $pull: { proposals: { $in: proposalIds } } }
    );

    // Remove the proposal IDs from users' participatedProposals
    await User.updateMany(
      { 'participatedProposals.proposalId': { $in: proposalIds } },
      { $pull: { participatedProposals: { proposalId: { $in: proposalIds } } } }
    );

    return deleteResult;
  } catch (error) {
    console.error('Error deleting proposals:', error);
    throw new Error('Error deleting proposals');
  }
};

const updateProposal = async (req, res) => {
  const { uniqueUrl } = req.params;
  const { title, description, name, email, receiveNotifications } = req.body;

  try {
    const proposal = await Proposal.findOne({ uniqueUrl });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    proposal.title = title;
    proposal.description = description;
    proposal.name = name;
    proposal.email = email;
    proposal.receiveNotifications = receiveNotifications;

    await proposal.save();

    res.json(proposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const submitVote = async (req, res) => {
  const { id } = req.params;
  const { name, opinion, comment } = req.body;

  try {
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    proposal.votes.push({ name, opinion, comment });
    await proposal.save();

    const addedVote = proposal.votes[proposal.votes.length - 1];

    if (proposal.email) {
      const emailSubject = 'New Vote Submitted';
      const emailContent = `
        <p>A new vote has been submitted for your proposal titled "<strong>${proposal.title}</strong>".</p>
        <p><strong>Submitted by:</strong> ${name}</p>
        <p><strong>Vote:</strong> ${opinion}</p>
        <p><strong>Comment:</strong> ${comment}</p>
        <p><a href="${process.env.ORIGIN}${proposal.uniqueUrl}">View Proposal</a></p>
      `;

      await sendEmail(proposal.email, emailSubject, emailContent);
    }

    res.status(200).json({ message: 'Vote submitted successfully', proposal, addedVote });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateVote = async (req, res) => {
  const { id } = req.params;
  const { _id, opinion, comment, name } = req.body;

  try {
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const voteToUpdate = proposal.votes.id(_id);
    if (!voteToUpdate) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (opinion !== undefined) voteToUpdate.opinion = opinion;
    if (comment !== undefined) voteToUpdate.comment = comment;
    if (name !== undefined) voteToUpdate.name = name;
    voteToUpdate.updatedAt = new Date();

    await proposal.save();

    res.status(200).json({ message: 'Vote updated successfully' });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteVote = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findOne({ 'votes._id': id });
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal containing the vote not found' });
    }

    const voteIndex = proposal.votes.findIndex(vote => vote._id.toString() === id);
    if (voteIndex === -1) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    proposal.votes.splice(voteIndex, 1);

    await proposal.save();

    res.status(200).json({ message: 'Vote deleted successfully' });
  } catch (error) {
    console.error('Error deleting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSubmittedVotes = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.status(200).json({ votes: proposal.votes });
  } catch (error) {
    console.error('Error fetching submitted votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProposal,
  getActiveProposals,
  getExpiredProposals,
  getAllProposals,
  getProposal,
  checkFirstRender,
  deleteProposal,
  updateProposal,
  submitVote,
  updateVote,
  getSubmittedVotes,
  deleteVote,
  getExampleProposal,
  deleteProposalsByUser,
};
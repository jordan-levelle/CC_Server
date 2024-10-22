const Proposal = require('../models/Proposal');
const User = require('../models/User');
const Team = require('../models/Teams');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 
const { sendEmail, addVoteToQueue, generateVoteEmailContent } = require('../utils/EmailUtils');



const getAllProposals = async (req, res) => {
  const user_id = req.user._id;
  const proposals = await Proposal.find({ user_id }).sort({ createdAt: -1 });
  res.status(200).json(proposals);
};





const getProposal = async (req, res) => {
  const { uniqueUrl } = req.params;

  try {
    let proposal = await Proposal.findOne({ uniqueUrl });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Create a proposal object without the userId
    const { user_id, ...proposalData } = proposal.toObject(); // Exclude userId from the response

    // Check if the user making the request is the owner of the proposal
    const isOwner = req.user && req.user._id.toString() === user_id.toString();

    res.status(200).json({ proposal: proposalData, isOwner }); // Send proposal data without userId and isOwner flag
  } catch (error) {
    console.error('Error fetching proposal by unique URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};







const createProposal = async (req, res) => {
  const { title, description, name, email, teamId } = req.body;

  try {
    const { nanoid } = await import('nanoid'); // Dynamically import nanoid
    const uniqueUrl = nanoid(10);
    const userId = req.user ? req.user._id : process.env.DUMMY_USER;
    const emailValue = email || null;
    const nameValue = name || '';

    // Retrieve the team name if teamId is provided
    let teamName = null;
    if (teamId) {
      const team = await Team.findById(teamId).populate('members');
      if (team) {
        teamName = team.teamName;
      } else {
        console.log(`Team with ID ${teamId} not found.`);
      }
    }

    const proposalData = {
      title,
      description,
      name: nameValue,
      email: emailValue,
      user_id: userId,
      uniqueUrl,
      teamId: teamId || null, 
      teamName: teamName || null, 
    };

    const proposal = await Proposal.create(proposalData);

    // Associate proposal with user if not using DUMMY_USER
    if (userId !== process.env.DUMMY_USER) {
      await User.findByIdAndUpdate(
        userId,
        { $push: { proposals: proposal._id } },
        { new: true }
      );
    }

    // Send email to the creator if email is provided
    if (emailValue) {
      const uniqueId = uuidv4(); 
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

    // If teamId is provided, notify the team members
    if (teamId && teamName) {
      const team = await Team.findById(teamId).populate('members'); 
      if (team && team.members.length > 0) {
        const memberEmails = team.members.map(member => member.memberEmail);

        const teamEmailSubject = `New Proposal: ${title}`;
        const teamEmailContent = `
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Submitted by:</strong> ${nameValue}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p>New proposal has been submitted to your team: ${teamName}</p>
          <p><a href="${process.env.ORIGIN}${uniqueUrl}">Link to Proposal</a></p>
        `;
        await sendEmail(memberEmails, teamEmailSubject, teamEmailContent);
      } else {
        console.log("No members found in the selected team.");
      }
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

  // Remove the proposal ID from users proposals
  await User.updateMany(
    { proposals: id },
    { $pull: { proposals: id } }
  );

  // Remove the proposal ID from users participatedProposals
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

    // Remove the proposal IDs from users proposals
    await User.updateMany(
      { proposals: { $in: proposalIds } },
      { $pull: { proposals: { $in: proposalIds } } }
    );

    // Remove the proposal IDs from users participatedProposals
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



const submitVote = async (req, res) => {
  const { id } = req.params;
  const { name, opinion, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid proposal ID' });
  }

  try {
    // Find the proposal
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Find the owner of the proposal (this part is optional if you don't need to handle owners)
    const owner = await User.findById(proposal.user_id);

    // Check if the owner is not subscribed and if there are already 15 votes
    if (owner && !owner.subscriptionStatus && proposal.votes.length >= 15) {
      return res.status(200).json({
        message: 'Limit of 15 votes reached. Upgrade subscription for unlimited votes.',
        proposal, // Include proposal data for the frontend to use
        addedVote: null, // No vote was added
        limitReached: true, // Add a flag for the frontend to handle
      });
    }

    // Add the new vote
    proposal.votes.push({ name, opinion, comment });
    await proposal.save();

    const addedVote = proposal.votes[proposal.votes.length - 1];

    // Add vote to the notification queue
    addVoteToQueue(id, proposal, { name, opinion, comment, action: 'submit' });

    // Return success message
    res.status(200).json({
      message: 'Vote submitted successfully',
      proposal,
      addedVote,
      limitReached: false, // The limit wasn't reached
    });
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

    // Add updated vote to the notification queue
    addVoteToQueue(id, proposal, { name, opinion, comment, action: 'update' });

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




module.exports = {
  createProposal,
  getAllProposals,
  getProposal,
  checkFirstRender,
  deleteProposal,
  updateProposal,
  submitVote,
  updateVote,
  getSubmittedVotes,
  deleteVote,
  deleteProposalsByUser,
};
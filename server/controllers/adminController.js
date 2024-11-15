const Proposal = require('../models/Proposal');
const User = require('../models/User');

const BASE_URL = process.env.BASE_FRONTEND_URL;

const getAllProposalsAdmin = async (req, res) => {
    try {
      const proposals = await Proposal.find();
  
      // Transform the proposals to include the full URL
      const processedProposals = proposals.map(proposal => ({
        ...proposal._doc, // Use `_doc` to access the plain object of the Mongoose document
        uniqueUrl: `${BASE_URL}/${proposal.uniqueUrl}`, // Append the base URL
      }));
  
      res.status(200).json(processedProposals);
    } catch (error) {
      console.error('Error fetching all proposals: ', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

const getAllUsersAdmin = async (req, res) => {
    try {
      const users = await User.find().populate('proposals'); // Populate proposals to get count
  
      // Transform data to include proposal count
      const userData = users.map(user => ({
        _id: user._id,
        email: user.email,
        proposals: user.proposals,
        proposalCount: user.proposals ? user.proposals.length : 0,
        subscriptionStatus: user.subscriptionStatus,
      }));
  
      res.status(200).json(userData);
    } catch (error) {
      console.error('Error fetching all users: ', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

module.exports = {
    getAllProposalsAdmin,
    getAllUsersAdmin
}
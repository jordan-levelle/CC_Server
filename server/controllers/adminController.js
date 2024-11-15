const Proposal = require('../models/Proposal');
const User = require('../models/User');


const getAllProposalsAdmin = async (req, res) => {
    try {
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ message: 'Access denied.'})
        // }

        const proposals = await Proposal.find();

        res.status(200).json(proposals);
    } catch (error) {
        console.error('Error fetching all proposals: ', error)
        res.status(500).json({ message: 'Server error'})
    }
}

const getAllUsersAdmin = async (req, res) => {
    try {
      const users = await User.find().populate('proposals'); // Populate proposals to get count
  
      // Transform data to include proposal count
      const userData = users.map(user => ({
        _id: user._id,
        email: user.email,
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
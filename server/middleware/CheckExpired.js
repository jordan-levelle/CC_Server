const Proposal = require('../models/Proposal');

const checkExpiredProposal = async (req, res, next) => {
    const {id} = req.params;

    try {
        const proposal = await Proposal.findById(id);
        if(proposal.expired) {
            return res.status(403).json({ message: 'Access to expired proposals is restricted.'}) 
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking proposal', error });
    }
}

module.exports = checkExpiredProposal;
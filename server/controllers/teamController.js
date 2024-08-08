const Team = require('../models/Teams');
const User = require('../models/User');

const createTeam = async (req, res) => {
  const { teamName, members } = req.body;
  const userId = req.user._id;

  const team = new Team({
    teamName,
    members,
    createdBy: userId
  });

  try {
    await team.save();

    // Add the team reference to the user document
    const user = await User.findById(userId);
    user.userTeams.push({ teamId: team._id });
    await user.save();

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

const deleteTeam = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user._id;

  try {
    // Find the team by its _id
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if the team was created by the user
    if (team.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Remove the team
    await team.remove();

    // Remove the team reference from the user document
    await User.findByIdAndUpdate(userId, {
      $pull: { userTeams: { _id: team._id } }  // This will now work as expected
    });

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};


  const editTeam = async (req, res) => {
    const { teamId } = req.params;
    const { teamName, members } = req.body;
    const userId = req.user._id;
  
    try {
      const team = await Team.findById(teamId);
  
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
  
      if (team.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized action' });
      }
  
      team.teamName = teamName || team.teamName;
      team.members = members || team.members;
  
      await team.save();
  
      res.status(200).json({ message: 'Team updated successfully', team });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error });
    }
  };


  const teamList = async (req, res) => {
    const userId = req.user._id;
  
    try {
      const user = await User.findById(userId).populate({
        path: 'userTeams.teamId',
        model: 'Teams'
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const teams = user.userTeams.map(userTeam => userTeam.teamId);
  
      console.log('Fetched Teams:', teams); // Debugging log
  
      res.status(200).json({ message: 'Teams fetched successfully', teams });
    } catch (error) {
      console.error('Error fetching teams:', error); // Debugging log
      res.status(500).json({ message: 'Internal server error', error });
    }
  };

module.exports = { 
    createTeam, 
    editTeam,
    deleteTeam,
    teamList
};
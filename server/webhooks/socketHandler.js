// socketHandlers.js
module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('New client connected');
  
      socket.on('joinProposal', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });
  
      socket.on('voteSubmitted', (roomId, newVote) => {
        io.to(roomId).emit('voteSubmitted', {
          proposalId: roomId,
          newVote,
        });
      });
  
      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
  };
  
  
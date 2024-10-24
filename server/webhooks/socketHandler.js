module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinProposal', (roomId) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        // Emit 'newVote' instead of 'voteSubmitted'
        socket.on('voteSubmitted', (roomId, newVote) => {
            console.log(`Vote submitted in room ${roomId}:`, newVote); // Log the vote being submitted
            io.to(roomId).emit('newVote', newVote); // Emit 'newVote' event with the newVote data
            console.log(`Emitted 'newVote' to room ${roomId}`); // Log emission
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

  
  
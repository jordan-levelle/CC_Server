// socketHandlers.js
module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinProposal', (roomId) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        // Update this line to emit 'newVote' instead of 'voteSubmitted'
        socket.on('voteSubmitted', (roomId, newVote) => {
            io.to(roomId).emit('newVote', newVote); // Emit 'newVote' event with the newVote data
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

  
  
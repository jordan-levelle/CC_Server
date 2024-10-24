// In your socketHandlers.js
module.exports = (io, voteEmitter) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinProposal', (roomId) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        // Listen for vote events from the EventEmitter
        voteEmitter.on('newVote', (roomId, newVote) => {
            console.log(`Emitting 'newVote' to room ${roomId}`);
            io.to(roomId).emit('newVote', newVote); // Emit 'newVote' event with the newVote data
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

  
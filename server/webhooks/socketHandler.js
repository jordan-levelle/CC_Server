// In socketHandlers.js

/* 
module.exports = (io, voteEmitter) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinProposal', (roomId) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    // Register the voteEmitter listener once, outside of the socket connection event
    voteEmitter.on('newVote', (roomId, newVote) => {
        console.log(`Emitting 'newVote' to room ${roomId}`);
        io.to(roomId).emit('newVote', newVote);
    });
};

*/



  
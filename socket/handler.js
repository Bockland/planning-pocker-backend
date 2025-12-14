const Room = require('../models/Room');

module.exports = (io, socket) => {
  console.log('User connected:', socket.id);

  // User joins a room
  socket.on('join_room', async ({ roomId, name, isAdmin, userId }) => {
    try {
      socket.join(roomId);

      let room = await Room.findOne({ roomId });

      if (!room) {
        // Create new room with ownerId
        room = new Room({ roomId, ownerId: userId, participants: [] });
      }

      // Check if user already exists in room by userId (more reliable)
      const existingParticipant = room.participants.find(p => p.userId === userId);
      
      if (existingParticipant) {
        existingParticipant.socketId = socket.id;
        existingParticipant.isAdmin = isAdmin || existingParticipant.isAdmin;
        existingParticipant.name = name; // Update name in case it changed
      } else {
        // Add new participant with required userId
        room.participants.push({ 
            userId, 
            name, 
            socketId: socket.id, 
            vote: null, 
            isAdmin: !!isAdmin 
        });
      }

      await room.save();
      io.to(roomId).emit('update_room', room);
      console.log(`${name} (${userId}) joined room ${roomId} (Admin: ${isAdmin})`);

    } catch (err) {
      console.error('Error joining room:', err);
      // Optional: emit error back to client
    }
  });

  // User votes
  socket.on('vote', async ({ roomId, vote }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const participant = room.participants.find(p => p.socketId === socket.id);
      // Ensure admin cannot vote
      if (participant && !participant.isAdmin) {
        participant.vote = vote;
        await room.save();
        io.to(roomId).emit('update_room', room);
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  });

  // Organizer reveals cards
  socket.on('reveal', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      room.isRevealed = true;
      await room.save();
      io.to(roomId).emit('update_room', room);
    } catch (err) {
      console.error('Error revealing:', err);
    }
  });

  // Organizer resets connection
  socket.on('reset', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      room.isRevealed = false;
      room.participants.forEach(p => p.vote = null);
      await room.save();
      io.to(roomId).emit('update_room', room);
    } catch (err) {
      console.error('Error resetting:', err);
    }
  });

  // Kick Participant
  socket.on('kick_participant', async ({ roomId, targetSocketId }) => {
    try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const participantIdx = room.participants.findIndex(p => p.socketId === targetSocketId);
        if (participantIdx !== -1) {
            const removedUser = room.participants[participantIdx];
            room.participants.splice(participantIdx, 1);
            await room.save();
            
            io.to(roomId).emit('update_room', room);
            io.to(targetSocketId).emit('kicked');
            
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.leave(roomId);
            }
            console.log(`Kicked ${removedUser.name} from room ${roomId}`);
        }
    } catch (err) {
        console.error('Error kicking:', err);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
  });
};

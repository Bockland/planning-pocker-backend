const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  socketId: { type: String, required: true },
  vote: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true }, // User ID of the creator
  participants: [ParticipantSchema],
  isRevealed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h
});

module.exports = mongoose.model('Room', RoomSchema);

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, default: '' },
  passedTests: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  completedAt: Date,
  status: {
    type: String,
    enum: ['coding', 'completed', 'forfeited'],
    default: 'coding'
  }
}, { _id: false });

const ratingChangeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  oldRating: Number,
  newRating: Number,
  change: Number
}, { _id: false });

const matchSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [playerSchema],
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting'
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: Date,
  endedAt: Date,
  ratingChanges: [ratingChangeSchema]
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);

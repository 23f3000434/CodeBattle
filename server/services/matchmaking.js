const { v4: uuidv4 } = require('uuid');
const Problem = require('../models/Problem');
const Match = require('../models/Match');

class MatchmakingService {
  constructor() {
    this.queue = [];
  }

  addToQueue(socket, userId, rating) {
    const existing = this.queue.find(p => p.userId === userId);
    if (existing) return false;

    this.queue.push({
      socket,
      userId,
      rating,
      joinedAt: Date.now()
    });
    return true;
  }

  removeFromQueue(socketId) {
    this.queue = this.queue.filter(p => p.socket.id !== socketId);
  }

  findMatch() {
    if (this.queue.length < 2) return null;

    for (let i = 0; i < this.queue.length; i++) {
      for (let j = i + 1; j < this.queue.length; j++) {
        const p1 = this.queue[i];
        const p2 = this.queue[j];
        const ratingDiff = Math.abs(p1.rating - p2.rating);

        const waitTime = Math.max(
          Date.now() - p1.joinedAt,
          Date.now() - p2.joinedAt
        );

        const allowedDiff = 200 + Math.floor(waitTime / 10000) * 50;

        if (ratingDiff <= allowedDiff) {
          this.queue.splice(j, 1);
          this.queue.splice(i, 1);
          return { player1: p1, player2: p2 };
        }
      }
    }

    return null;
  }

  async createRoom(player1, player2) {
    const problemCount = await Problem.countDocuments();
    if (problemCount === 0) throw new Error('No problems available. Run seed first.');

    const randomIndex = Math.floor(Math.random() * problemCount);
    const problem = await Problem.findOne().skip(randomIndex);

    const roomId = uuidv4().slice(0, 8);

    const match = await Match.create({
      roomId,
      players: [
        { user: player1.userId, totalTests: problem.testCases.length },
        { user: player2.userId, totalTests: problem.testCases.length }
      ],
      problem: problem._id,
      status: 'in_progress',
      startedAt: new Date()
    });

    return { roomId, match, problem };
  }

  getQueueSize() {
    return this.queue.length;
  }
}

module.exports = new MatchmakingService();

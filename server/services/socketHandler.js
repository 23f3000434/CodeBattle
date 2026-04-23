const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Match = require('../models/Match');
const Problem = require('../models/Problem');
const matchmaking = require('./matchmaking');
const { executeCode } = require('./codeRunner');
const { calculateNewRatings } = require('../utils/elo');

const activeUsers = new Map();
const roomTimers = new Map();
const pendingMatches = new Map(); // roomId -> matchData (cache for late joiners)

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
          socket.emit('auth_error', 'User not found');
          return;
        }

        activeUsers.set(socket.id, {
          userId: user._id.toString(),
          username: user.username,
          rating: user.rating
        });

        socket.emit('authenticated', { userId: user._id, username: user.username });
      } catch (err) {
        socket.emit('auth_error', 'Invalid token');
      }
    });

    socket.on('join_queue', () => {
      const userData = activeUsers.get(socket.id);
      if (!userData) {
        socket.emit('error_msg', 'Not authenticated');
        return;
      }

      const added = matchmaking.addToQueue(socket, userData.userId, userData.rating);
      if (added) {
        socket.emit('queue_joined', { position: matchmaking.getQueueSize() });
        tryMatchmaking(io);
      }
    });

    socket.on('leave_queue', () => {
      matchmaking.removeFromQueue(socket.id);
      socket.emit('queue_left');
    });

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      // Re-send cached match data for late joiners (page navigation race condition)
      const cached = pendingMatches.get(roomId);
      if (cached) {
        const userData = activeUsers.get(socket.id);
        if (userData) {
          if (!cached.sentTo) cached.sentTo = new Set();
          const isP1 = cached.player1UserId === userData.userId;
          const isP2 = cached.player2UserId === userData.userId;
          if ((isP1 || isP2) && !cached.sentTo.has(userData.userId)) {
            cached.sentTo.add(userData.userId);
            const opponentData = isP1 ? cached.player2Data : cached.player1Data;
            socket.emit('match_found', {
              roomId: cached.roomId,
              matchId: cached.matchId,
              problem: cached.problem,
              startedAt: cached.startedAt,
              opponent: opponentData
            });
            console.log('[Socket] Re-sent cached match to', userData.username);
          }
        }
      }
    });

    socket.on('code_update', async ({ roomId, passedTests, totalTests }) => {
      const userData = activeUsers.get(socket.id);
      if (!userData) return;

      socket.to(roomId).emit('opponent_progress', {
        passedTests,
        totalTests
      });
    });

    socket.on('submit_code', async ({ roomId, code }) => {
      const userData = activeUsers.get(socket.id);
      if (!userData) return;

      try {
        const match = await Match.findOne({ roomId }).populate('problem');
        if (!match || match.status === 'completed') return;

        const result = executeCode(code, match.problem.testCases);

        const playerIndex = match.players.findIndex(
          p => p.user.toString() === userData.userId
        );
        if (playerIndex === -1) return;

        match.players[playerIndex].code = code;
        match.players[playerIndex].passedTests = result.passed;
        match.players[playerIndex].totalTests = result.total;
        match.players[playerIndex].completedAt = new Date();
        match.players[playerIndex].status = 'completed';
        await match.save();

        const visibleResults = result.results.filter(r => !r.isHidden);
        socket.emit('submission_result', {
          passed: result.passed,
          total: result.total,
          results: visibleResults
        });

        socket.to(roomId).emit('opponent_progress', {
          passedTests: result.passed,
          totalTests: result.total
        });

        const allDone = match.players.every(p => p.status !== 'coding');
        if (allDone) {
          await resolveMatch(io, match);
        }
      } catch (err) {
        socket.emit('error_msg', 'Submission failed');
        console.error('Submit error:', err);
      }
    });

    socket.on('forfeit', async ({ roomId }) => {
      const userData = activeUsers.get(socket.id);
      if (!userData) return;

      try {
        const match = await Match.findOne({ roomId });
        if (!match || match.status === 'completed') return;

        const playerIndex = match.players.findIndex(
          p => p.user.toString() === userData.userId
        );
        if (playerIndex === -1) return;

        match.players[playerIndex].status = 'forfeited';
        match.players[playerIndex].completedAt = new Date();
        await match.save();

        const allDone = match.players.every(p => p.status !== 'coding');
        if (allDone) {
          await resolveMatch(io, match);
        }
      } catch (err) {
        console.error('Forfeit error:', err);
      }
    });

    socket.on('disconnect', () => {
      matchmaking.removeFromQueue(socket.id);
      activeUsers.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

async function tryMatchmaking(io) {
  const matchResult = matchmaking.findMatch();
  if (!matchResult) return;

  const { player1, player2 } = matchResult;

  try {
    const { roomId, match, problem } = await matchmaking.createRoom(player1, player2);

    const publicProblem = problem.toObject();
    publicProblem.testCases = publicProblem.testCases.filter(tc => !tc.isHidden);

    const matchData = {
      roomId,
      matchId: match._id,
      problem: publicProblem,
      startedAt: match.startedAt
    };

    player1.socket.join(roomId);
    player2.socket.join(roomId);

    const user1 = await User.findById(player1.userId);
    const user2 = await User.findById(player2.userId);

    // Cache match data for late joiners
    pendingMatches.set(roomId, {
      roomId,
      matchId: match._id,
      problem: publicProblem,
      startedAt: match.startedAt,
      player1UserId: player1.userId,
      player2UserId: player2.userId,
      player1Data: { username: user1.username, rating: user1.rating },
      player2Data: { username: user2.username, rating: user2.rating }
    });
    setTimeout(() => pendingMatches.delete(roomId), 300000); // cleanup after 5min

    player1.socket.emit('match_found', {
      ...matchData,
      opponent: { username: user2.username, rating: user2.rating }
    });

    player2.socket.emit('match_found', {
      ...matchData,
      opponent: { username: user1.username, rating: user1.rating }
    });

    roomTimers.set(roomId, setTimeout(async () => {
      const m = await Match.findOne({ roomId });
      if (m && m.status !== 'completed') {
        m.players.forEach(p => {
          if (p.status === 'coding') p.status = 'completed';
        });
        await m.save();
        await resolveMatch(io, m);
      }
      roomTimers.delete(roomId);
    }, 600000));

  } catch (err) {
    console.error('Matchmaking error:', err);
    player1.socket.emit('error_msg', 'Failed to create match');
    player2.socket.emit('error_msg', 'Failed to create match');
  }
}

async function resolveMatch(io, match) {
  if (match.status === 'completed') return;

  const [p1, p2] = match.players;

  let winnerId = null;
  let result;

  if (p1.status === 'forfeited' && p2.status !== 'forfeited') {
    winnerId = p2.user;
    result = 0;
  } else if (p2.status === 'forfeited' && p1.status !== 'forfeited') {
    winnerId = p1.user;
    result = 1;
  } else if (p1.passedTests > p2.passedTests) {
    winnerId = p1.user;
    result = 1;
  } else if (p2.passedTests > p1.passedTests) {
    winnerId = p2.user;
    result = 0;
  } else {
    if (p1.completedAt && p2.completedAt) {
      if (p1.completedAt < p2.completedAt) {
        winnerId = p1.user;
        result = 1;
      } else if (p2.completedAt < p1.completedAt) {
        winnerId = p2.user;
        result = 0;
      } else {
        result = 0.5;
      }
    } else {
      result = 0.5;
    }
  }

  const user1 = await User.findById(p1.user);
  const user2 = await User.findById(p2.user);

  const ratings = calculateNewRatings(user1.rating, user2.rating, result);

  user1.rating = ratings.playerA.newRating;
  user2.rating = ratings.playerB.newRating;

  if (result === 1) {
    user1.wins += 1;
    user2.losses += 1;
  } else if (result === 0) {
    user2.wins += 1;
    user1.losses += 1;
  } else {
    user1.draws += 1;
    user2.draws += 1;
  }

  user1.matchHistory.push(match._id);
  user2.matchHistory.push(match._id);

  await user1.save();
  await user2.save();

  match.winner = winnerId;
  match.status = 'completed';
  match.endedAt = new Date();
  match.ratingChanges = [
    { user: p1.user, ...ratings.playerA },
    { user: p2.user, ...ratings.playerB }
  ];
  await match.save();

  pendingMatches.delete(match.roomId);
  if (roomTimers.has(match.roomId)) {
    clearTimeout(roomTimers.get(match.roomId));
    roomTimers.delete(match.roomId);
  }

  io.to(match.roomId).emit('match_complete', {
    winner: winnerId ? (winnerId.toString() === p1.user.toString() ? user1.username : user2.username) : null,
    winnerId: winnerId ? winnerId.toString() : null,
    isDraw: result === 0.5,
    players: [
      {
        userId: p1.user.toString(),
        username: user1.username,
        passedTests: p1.passedTests,
        totalTests: p1.totalTests,
        ratingChange: ratings.playerA.change,
        newRating: ratings.playerA.newRating
      },
      {
        userId: p2.user.toString(),
        username: user2.username,
        passedTests: p2.passedTests,
        totalTests: p2.totalTests,
        ratingChange: ratings.playerB.change,
        newRating: ratings.playerB.newRating
      }
    ]
  });
}

module.exports = { setupSocketHandlers };

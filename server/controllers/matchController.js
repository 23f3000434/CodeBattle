const Match = require('../models/Match');
const User = require('../models/User');

exports.getMatchHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      'players.user': req.user._id,
      status: 'completed'
    })
      .populate('players.user', 'username rating')
      .populate('problem', 'title difficulty')
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Match.countDocuments({
      'players.user': req.user._id,
      status: 'completed'
    });

    res.json({
      success: true,
      data: { matches, total, page, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('players.user', 'username rating')
      .populate('problem', 'title difficulty description')
      .populate('winner', 'username');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    res.json({ success: true, data: { match } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .select('username rating wins losses draws')
      .sort({ rating: -1 })
      .limit(50);

    res.json({ success: true, data: { leaderboard: users } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

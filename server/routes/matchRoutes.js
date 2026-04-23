const router = require('express').Router();
const { getMatchHistory, getMatchById, getLeaderboard } = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/history', protect, getMatchHistory);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', protect, getMatchById);

module.exports = router;

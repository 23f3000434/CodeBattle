const router = require('express').Router();
const { getProblems, getProblemById } = require('../controllers/problemController');

router.get('/', getProblems);
router.get('/:id', getProblemById);

module.exports = router;

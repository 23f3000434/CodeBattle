const Problem = require('../models/Problem');

exports.getProblems = async (req, res) => {
  try {
    const { difficulty } = req.query;
    const filter = difficulty ? { difficulty } : {};
    const problems = await Problem.find(filter).select('-testCases');
    res.json({ success: true, data: { problems } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const publicProblem = problem.toObject();
    publicProblem.testCases = publicProblem.testCases.filter(tc => !tc.isHidden);

    res.json({ success: true, data: { problem: publicProblem } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

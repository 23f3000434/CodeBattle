const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  testCases: [testCaseSchema],
  starterCode: {
    javascript: { type: String, default: 'function solution(input) {\n  // your code here\n}' }
  },
  constraints: [String],
  tags: [String],
  timeLimit: { type: Number, default: 300 },
  memoryLimit: { type: Number, default: 256 }
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);

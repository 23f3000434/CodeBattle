require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Problem = require('../models/Problem');

const problems = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nYou may assume each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer as an array of two indices.',
    difficulty: 'easy',
    starterCode: {
      javascript: 'function solution(input) {\n  const { nums, target } = input;\n  // return [index1, index2]\n}'
    },
    constraints: ['2 <= nums.length <= 1000', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists'],
    tags: ['array', 'hash-map'],
    testCases: [
      { input: '{"nums": [2, 7, 11, 15], "target": 9}', expectedOutput: '[0,1]', isHidden: false },
      { input: '{"nums": [3, 2, 4], "target": 6}', expectedOutput: '[1,2]', isHidden: false },
      { input: '{"nums": [3, 3], "target": 6}', expectedOutput: '[0,1]', isHidden: false },
      { input: '{"nums": [1, 5, 8, 3, 9], "target": 12}', expectedOutput: '[1,3]', isHidden: true },
      { input: '{"nums": [-1, -2, -3, -4, -5], "target": -8}', expectedOutput: '[2,4]', isHidden: true }
    ]
  },
  {
    title: 'Palindrome Check',
    description: 'Given a string `s`, return `true` if it is a palindrome, `false` otherwise.\n\nA palindrome reads the same forward and backward. Consider only alphanumeric characters and ignore case.',
    difficulty: 'easy',
    starterCode: {
      javascript: 'function solution(input) {\n  const s = input;\n  // return true or false\n}'
    },
    constraints: ['1 <= s.length <= 10000', 's contains printable ASCII characters'],
    tags: ['string', 'two-pointer'],
    testCases: [
      { input: '"racecar"', expectedOutput: 'true', isHidden: false },
      { input: '"hello"', expectedOutput: 'false', isHidden: false },
      { input: '"A man a plan a canal Panama"', expectedOutput: 'true', isHidden: false },
      { input: '""', expectedOutput: 'true', isHidden: true },
      { input: '"ab"', expectedOutput: 'false', isHidden: true }
    ]
  },
  {
    title: 'FizzBuzz',
    description: 'Given an integer `n`, return an array of strings from 1 to n where:\n\n- For multiples of 3, use `"Fizz"`\n- For multiples of 5, use `"Buzz"`\n- For multiples of both 3 and 5, use `"FizzBuzz"`\n- Otherwise, use the number as a string',
    difficulty: 'easy',
    starterCode: {
      javascript: 'function solution(input) {\n  const n = input;\n  // return array of strings\n}'
    },
    constraints: ['1 <= n <= 10000'],
    tags: ['math', 'simulation'],
    testCases: [
      { input: '5', expectedOutput: '["1","2","Fizz","4","Buzz"]', isHidden: false },
      { input: '3', expectedOutput: '["1","2","Fizz"]', isHidden: false },
      { input: '15', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: false },
      { input: '1', expectedOutput: '["1"]', isHidden: true },
      { input: '30', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz","16","17","Fizz","19","Buzz","Fizz","22","23","Fizz","Buzz","26","Fizz","28","29","FizzBuzz"]', isHidden: true }
    ]
  },
  {
    title: 'Reverse Linked List',
    description: 'Given an array representing a linked list, reverse it in-place and return the reversed array.\n\nExample: [1, 2, 3, 4, 5] becomes [5, 4, 3, 2, 1]',
    difficulty: 'medium',
    starterCode: {
      javascript: 'function solution(input) {\n  const arr = input;\n  // return reversed array\n}'
    },
    constraints: ['0 <= arr.length <= 5000', '-5000 <= arr[i] <= 5000'],
    tags: ['array', 'two-pointer'],
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
      { input: '[1, 2]', expectedOutput: '[2,1]', isHidden: false },
      { input: '[]', expectedOutput: '[]', isHidden: false },
      { input: '[1]', expectedOutput: '[1]', isHidden: true },
      { input: '[10, 20, 30, 40, 50, 60]', expectedOutput: '[60,50,40,30,20,10]', isHidden: true }
    ]
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nA string is valid if:\n1. Open brackets are closed by the same type of brackets\n2. Open brackets are closed in the correct order\n3. Every close bracket has a corresponding open bracket',
    difficulty: 'medium',
    starterCode: {
      javascript: 'function solution(input) {\n  const s = input;\n  // return true or false\n}'
    },
    constraints: ['1 <= s.length <= 10000', 's consists of parentheses only'],
    tags: ['stack', 'string'],
    testCases: [
      { input: '"()"', expectedOutput: 'true', isHidden: false },
      { input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
      { input: '"(]"', expectedOutput: 'false', isHidden: false },
      { input: '"([)]"', expectedOutput: 'false', isHidden: true },
      { input: '"{[]}"', expectedOutput: 'true', isHidden: true },
      { input: '""', expectedOutput: 'true', isHidden: true }
    ]
  },
  {
    title: 'Fibonacci Sequence',
    description: 'Given an integer `n`, return the first `n` numbers of the Fibonacci sequence.\n\nThe Fibonacci sequence starts with 0 and 1, and each subsequent number is the sum of the two preceding ones.',
    difficulty: 'medium',
    starterCode: {
      javascript: 'function solution(input) {\n  const n = input;\n  // return array of first n fibonacci numbers\n}'
    },
    constraints: ['1 <= n <= 50'],
    tags: ['math', 'dynamic-programming'],
    testCases: [
      { input: '5', expectedOutput: '[0,1,1,2,3]', isHidden: false },
      { input: '1', expectedOutput: '[0]', isHidden: false },
      { input: '8', expectedOutput: '[0,1,1,2,3,5,8,13]', isHidden: false },
      { input: '2', expectedOutput: '[0,1]', isHidden: true },
      { input: '10', expectedOutput: '[0,1,1,2,3,5,8,13,21,34]', isHidden: true }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Problem.deleteMany({});
    console.log('Cleared existing problems');

    await Problem.insertMany(problems);
    console.log(`Seeded ${problems.length} problems`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();

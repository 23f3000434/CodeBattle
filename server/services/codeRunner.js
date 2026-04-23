function executeCode(userCode, testCases, timeLimitMs = 5000) {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    try {
      const wrappedCode = `
        ${userCode}
        return solution(${tc.input});
      `;

      const fn = new Function(wrappedCode);

      const start = Date.now();
      let output;

      try {
        output = fn();
      } catch (runtimeErr) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: null,
          passed: false,
          error: runtimeErr.message,
          isHidden: tc.isHidden
        });
        continue;
      }

      const elapsed = Date.now() - start;
      if (elapsed > timeLimitMs) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: 'Time Limit Exceeded',
          passed: false,
          error: 'TLE',
          isHidden: tc.isHidden
        });
        continue;
      }

      const outputStr = JSON.stringify(output);
      const expectedStr = tc.expectedOutput.trim();
      const isPassed = outputStr === expectedStr;

      if (isPassed) passed++;

      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: outputStr,
        passed: isPassed,
        error: null,
        isHidden: tc.isHidden
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: null,
        passed: false,
        error: err.message,
        isHidden: tc.isHidden
      });
    }
  }

  return {
    passed,
    total: testCases.length,
    results
  };
}

module.exports = { executeCode };

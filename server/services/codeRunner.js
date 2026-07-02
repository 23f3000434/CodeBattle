const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Execute user code in a Worker thread for isolation and proper timeout handling.
 * Each test case runs in its own worker to prevent interference.
 */
async function executeCode(userCode, testCases, timeLimitMs = 5000) {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    try {
      const result = await runInWorker(userCode, tc, timeLimitMs);

      if (result.error) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: null,
          passed: false,
          error: result.error,
          isHidden: tc.isHidden
        });
        continue;
      }

      if (result.timedOut) {
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

      const outputStr = result.output;
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

/**
 * Run code in an isolated Worker thread with timeout
 */
function runInWorker(userCode, testCase, timeLimitMs) {
  return new Promise((resolve) => {
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');

      // Disable dangerous globals
      const _require = require;
      globalThis.require = undefined;
      globalThis.process = { env: {} };

      try {
        const userCode = workerData.userCode;
        const input = workerData.input;

        // Create a function from user code + test execution
        const wrappedCode = userCode + '\\nreturn JSON.stringify(solution(' + input + '));';
        const fn = new Function(wrappedCode);
        const result = fn();

        parentPort.postMessage({ output: result, error: null, timedOut: false });
      } catch (err) {
        parentPort.postMessage({ output: null, error: err.message, timedOut: false });
      }
    `;

    let resolved = false;

    const worker = new Worker(workerCode, {
      eval: true,
      workerData: {
        userCode: userCode,
        input: testCase.input
      },
      resourceLimits: {
        maxOldGenerationSizeMb: 64,
        maxYoungGenerationSizeMb: 16,
        codeRangeSizeMb: 16
      }
    });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        worker.terminate();
        resolve({ output: null, error: null, timedOut: true });
      }
    }, timeLimitMs);

    worker.on('message', (msg) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(msg);
      }
    });

    worker.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ output: null, error: err.message, timedOut: false });
      }
    });

    worker.on('exit', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        if (code !== 0) {
          resolve({ output: null, error: 'Execution failed (exit code ' + code + ')', timedOut: false });
        }
      }
    });
  });
}

module.exports = { executeCode };

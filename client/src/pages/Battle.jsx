import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import styles from '../styles/Battle.module.css';

function Battle() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [opponentProgress, setOpponentProgress] = useState({ passedTests: 0, totalTests: 0 });
  const [opponent, setOpponent] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);

  const timerRef = useRef(null);

  // Initialize from navigation state (passed from Dashboard)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const matchData = location.state?.matchData;
    if (matchData && matchData.problem) {
      console.log('[Battle] Init from nav state, room:', matchData.roomId);
      setProblem(matchData.problem);
      setCode(matchData.problem.starterCode?.javascript || '');
      setOpponent(matchData.opponent);
      setMatchStarted(true);
      initializedRef.current = true;
    }
  }, [location.state]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', roomId);

    const handleMatchFound = (data) => {
      if (data.roomId === roomId && !initializedRef.current) {
        console.log('[Battle] Received match_found from server');
        setProblem(data.problem);
        setCode(data.problem.starterCode?.javascript || '');
        setOpponent(data.opponent);
        setMatchStarted(true);
        initializedRef.current = true;
      }
    };

    const handleSubmissionResult = (result) => {
      setTestResults(result);
      setSubmitting(false);
    };

    const handleOpponentProgress = (progress) => {
      setOpponentProgress(progress);
    };

    const handleMatchComplete = (result) => {
      setMatchResult(result);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    socket.on('match_found', handleMatchFound);
    socket.on('submission_result', handleSubmissionResult);
    socket.on('opponent_progress', handleOpponentProgress);
    socket.on('match_complete', handleMatchComplete);

    return () => {
      socket.off('match_found', handleMatchFound);
      socket.off('submission_result', handleSubmissionResult);
      socket.off('opponent_progress', handleOpponentProgress);
      socket.off('match_complete', handleMatchComplete);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (matchStarted && !matchResult) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchStarted, matchResult]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = () => {
    if (!socket || submitting) return;
    setSubmitting(true);
    setTestResults(null);
    socket.emit('submit_code', { roomId, code });
  };

  const handleForfeit = () => {
    if (!socket) return;
    if (window.confirm('Are you sure you want to forfeit?')) {
      socket.emit('forfeit', { roomId });
    }
  };

  const getDifficultyClass = (diff) => {
    if (diff === 'easy') return styles.diffEasy;
    if (diff === 'medium') return styles.diffMedium;
    return styles.diffHard;
  };

  if (!problem) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingPulse}></div>
        <p>Waiting for match data...</p>
      </div>
    );
  }

  return (
    <div className={styles.battlePage}>
      <div className={styles.topBar}>
        <div className={styles.timerSection}>
          <span className={styles.timerLabel}>Time</span>
          <span className={styles.timer}>{formatTime(timer)}</span>
        </div>
        <div className={styles.opponentSection}>
          <span className={styles.opponentLabel}>
            {opponent?.username || 'Opponent'}
          </span>
          <span className={styles.opponentTests}>
            {opponentProgress.passedTests}/{opponentProgress.totalTests} tests
          </span>
        </div>
        <button onClick={handleForfeit} className={styles.forfeitBtn} disabled={!!matchResult}>
          Forfeit
        </button>
      </div>

      <div className={styles.battleContent}>
        <div className={styles.problemPanel}>
          <div className={styles.problemHeader}>
            <h2 className={styles.problemTitle}>{problem.title}</h2>
            <span className={`${styles.diffBadge} ${getDifficultyClass(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>

          <div className={styles.problemBody}>
            <div className={styles.description}>
              {problem.description.split('\n').map((line, i) => (
                <p key={i}>{line || <br />}</p>
              ))}
            </div>

            {problem.constraints?.length > 0 && (
              <div className={styles.constraints}>
                <h4>Constraints</h4>
                <ul>
                  {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {problem.testCases?.length > 0 && (
              <div className={styles.examples}>
                <h4>Examples</h4>
                {problem.testCases.map((tc, i) => (
                  <div key={i} className={styles.example}>
                    <div className={styles.exampleRow}>
                      <span className={styles.exampleLabel}>Input:</span>
                      <code>{tc.input}</code>
                    </div>
                    <div className={styles.exampleRow}>
                      <span className={styles.exampleLabel}>Output:</span>
                      <code>{tc.expectedOutput}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.editorPanel}>
          <div className={styles.editorWrapper}>
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                lineNumbers: 'on',
                tabSize: 2,
                automaticLayout: true
              }}
            />
          </div>

          {testResults && (
            <div className={styles.testResults}>
              <div className={styles.testSummary}>
                <span className={testResults.passed === testResults.total ? styles.allPassed : styles.someFailed}>
                  {testResults.passed}/{testResults.total} tests passed
                </span>
              </div>
              <div className={styles.testList}>
                {testResults.results.map((r, i) => (
                  <div key={i} className={`${styles.testCase} ${r.passed ? styles.testPassed : styles.testFailed}`}>
                    <span className={styles.testStatus}>{r.passed ? 'PASS' : 'FAIL'}</span>
                    <span className={styles.testInput}>Input: {r.input}</span>
                    {!r.passed && (
                      <div className={styles.testDiff}>
                        <span>Expected: {r.expected}</span>
                        <span>Got: {r.actual || r.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionBar}>
            <button
              onClick={handleSubmit}
              className={styles.submitBtn}
              disabled={submitting || !!matchResult}
            >
              {submitting ? 'Running...' : 'Submit Solution'}
            </button>
          </div>
        </div>
      </div>

      {matchResult && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              {matchResult.isDraw ? 'Draw!' :
                matchResult.winnerId === user._id ? 'You Won!' : 'You Lost'}
            </h2>
            <div className={styles.modalPlayers}>
              {matchResult.players.map((p, i) => (
                <div key={i} className={`${styles.modalPlayer} ${p.userId === matchResult.winnerId ? styles.modalWinner : ''}`}>
                  <span className={styles.modalUsername}>{p.username}</span>
                  <span className={styles.modalTests}>{p.passedTests}/{p.totalTests} tests</span>
                  <span className={p.ratingChange >= 0 ? styles.ratingUp : styles.ratingDown}>
                    {p.ratingChange >= 0 ? '+' : ''}{p.ratingChange} ({p.newRating})
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/dashboard')} className={styles.modalBtn}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Battle;

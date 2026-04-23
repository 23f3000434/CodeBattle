import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import RatingBadge from '../components/RatingBadge';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import styles from '../styles/Dashboard.module.css';

function Dashboard() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const fetchMatches = useCallback(async () => {
    try {
      const { data } = await api.get('/matches/history?limit=10');
      setMatches(data.data.matches);
    } catch (err) {
      console.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      console.log('[Dashboard] match_found:', data.roomId);
      setSearching(false);
      setSearchTime(0);
      navigate(`/battle/${data.roomId}`, { state: { matchData: data } });
    };

    socket.on('match_found', handleMatchFound);
    return () => socket.off('match_found', handleMatchFound);
  }, [socket, navigate]);

  useEffect(() => {
    let interval;
    if (searching) {
      interval = setInterval(() => setSearchTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [searching]);

  const handleFindBattle = () => {
    if (!socket || !isConnected) return;
    setSearching(true);
    setSearchTime(0);
    socket.emit('join_queue');
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    socket.emit('leave_queue');
    setSearching(false);
    setSearchTime(0);
  };

  const winRate = user.wins + user.losses > 0
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rating</span>
          <RatingBadge rating={user.rating} />
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Wins</span>
          <span className={`${styles.statValue} ${styles.wins}`}>{user.wins}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Losses</span>
          <span className={`${styles.statValue} ${styles.losses}`}>{user.losses}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Win Rate</span>
          <span className={styles.statValue}>{winRate}%</span>
        </div>
      </div>

      <div className={styles.battleSection}>
        {searching ? (
          <div className={styles.searchingState}>
            <div className={styles.searchingPulse}></div>
            <h2>Searching for opponent...</h2>
            <p className={styles.searchTimer}>{searchTime}s</p>
            <button onClick={handleCancelSearch} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleFindBattle}
            className={styles.findBattleBtn}
            disabled={!isConnected}
          >
            {isConnected ? 'Find Battle' : 'Connecting...'}
          </button>
        )}
      </div>

      <div className={styles.recentMatches}>
        <h3>Recent Matches</h3>
        {matches.length === 0 ? (
          <p className={styles.emptyState}>No matches yet. Start your first battle!</p>
        ) : (
          <div className={styles.matchList}>
            {matches.map(match => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

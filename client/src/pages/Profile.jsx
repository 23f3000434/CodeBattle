import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import styles from '../styles/Profile.module.css';

function Profile() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await api.get(`/matches/history?page=${page}&limit=15`);
        setMatches(data.data.matches);
        setTotalPages(data.data.pages);
      } catch (err) {
        console.error('Failed to load match history');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [page]);

  const winRate = user.wins + user.losses > 0
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h2 className={styles.username}>{user.username}</h2>
        <RatingBadge rating={user.rating} />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{user.wins}</span>
          <span className={styles.statLabel}>Wins</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{user.losses}</span>
          <span className={styles.statLabel}>Losses</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{user.draws}</span>
          <span className={styles.statLabel}>Draws</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{winRate}%</span>
          <span className={styles.statLabel}>Win Rate</span>
        </div>
      </div>

      <div className={styles.matchHistory}>
        <h3>Match History</h3>
        {matches.length === 0 ? (
          <p className={styles.emptyState}>No matches played yet.</p>
        ) : (
          <>
            <div className={styles.matchList}>
              {matches.map(match => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.pageBtn}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;

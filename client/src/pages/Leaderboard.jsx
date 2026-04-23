import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import styles from '../styles/Leaderboard.module.css';

function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/matches/leaderboard');
        setLeaderboard(data.data.leaderboard);
      } catch (err) {
        console.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.leaderboard}>
      <h2 className={styles.title}>Leaderboard</h2>
      <p className={styles.subtitle}>Top 50 players by rating</p>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Rating</th>
              <th>W</th>
              <th>L</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, i) => {
              const isCurrentUser = user && player._id === user._id;
              const wr = player.wins + player.losses > 0
                ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                : 0;

              return (
                <tr key={player._id} className={isCurrentUser ? styles.currentUser : ''}>
                  <td className={styles.rank}>
                    {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${i + 1}`}
                  </td>
                  <td className={styles.player}>
                    {player.username}
                    {isCurrentUser && <span className={styles.youBadge}>you</span>}
                  </td>
                  <td><RatingBadge rating={player.rating} inline /></td>
                  <td className={styles.wins}>{player.wins}</td>
                  <td className={styles.losses}>{player.losses}</td>
                  <td>{wr}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <p className={styles.emptyState}>No players yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
